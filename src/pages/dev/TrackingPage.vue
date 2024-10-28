<template>
  <q-page padding class="column">
    <div class="row justify-center q-pb-md" style="gap: 0.5rem">
      <q-btn
        @click='watchId ? stopTracking() : beginTracking()'
        :label='watchId ? "Stop tracking" : "Start tracking"'
        :color='watchId ? "negative" : "positive"'
        size="1rem"
        rounded
        no-caps
      >
        <q-spinner-radio v-if="LoadingPosition" style="margin-left: 0.4em;" ></q-spinner-radio>
      </q-btn>
      <q-btn
        @click="SettingsVisible = true"
        icon="settings"
        round
      />
    </div>

    <q-dialog v-model="SettingsVisible">
      <q-card>
        <q-card-section>
          <div class="text-h6">Settings</div>
        </q-card-section>

        <q-separator inset/>
        <q-item-label header>Debug</q-item-label>

        <q-item tag="label">
          <q-item-section>Show location log path</q-item-section>
          <q-item-section avatar>
            <q-checkbox v-model="Settings.ShowLogPath"/>
          </q-item-section>
        </q-item>

        <q-separator inset/>
        <q-item-label header>Logging</q-item-label>

        <q-item tag="label">
          <q-item-section>Enable location logging</q-item-section>
          <q-item-section avatar>
            <q-checkbox v-model="Settings.LoggingEnabled"/>
          </q-item-section>
        </q-item>

        <q-item tag="label">
          <q-item-section>Import logs from JSON</q-item-section>
          <q-item-section avatar>
            <q-file
              v-model="LogFile"
              @update:model-value="confirmLogImport"
              :style="[LogFile ? {} : {'width': '100px'}]"
              accept="application/json"
              standout
              dense
            >
              <template v-slot:prepend>
                <q-icon name="upload_file"/>
              </template>
            </q-file>
          </q-item-section>
        </q-item>

        <q-item tag="label" v-show="LoggedPositions.length > 0">
          <q-item-section>Save logs to JSON</q-item-section>
          <q-item-section avatar>
            <q-btn
              @click="saveLogsToFile"
              icon="save"
              :label="'(' + LoggedPositions.length + ')'"
            />
          </q-item-section>
        </q-item>

        <q-item tag="label" v-show="LoggedPositions.length > 0">
          <q-item-section>Clear location logs</q-item-section>
          <q-item-section avatar>
            <q-btn
              @click="clearLogs"
              color="negative"
              icon="delete"
              padding="0.5rem"
              flat
            />
          </q-item-section>
        </q-item>
      </q-card>
    </q-dialog>
    <BusMap
      class="col"
      style="min-height: none; border-radius: 6px"
      :id-blacklist="trackerId"
      @map-loaded="mapLoaded"
    >
      <div
        v-if="Location"
        @dblclick="copyLocation"
        class="maplibregl-ctrl-group"
        style="user-select: none; font-size: 1.2em; top: 0.4em; left: 0.4em; position: absolute; z-index: 10;
          padding: 0.1em 0.25em; opacity: 0.7;
        "
      >
        lat: {{Location.latitude}} <br>
        long: {{Location.longitude}}
      </div>
    </BusMap>
  </q-page>
</template>

<script setup>
import { ref, shallowRef, triggerRef, watch } from 'vue'
import { useQuasar, Notify, LocalStorage, copyToClipboard, exportFile } from 'quasar'

import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

import { Marker } from 'maplibre-gl'
import BusMap from 'src/components/BusMap.vue'

import axios from 'axios'
import { apiServers } from 'components/constants'

const $q = useQuasar()

const SettingsVisible = ref(false)

const Settings = ref({
  ShowLogPath: true,
  LoggingEnabled: false
})

const LogFile = ref(null)
const LoggedPositions = shallowRef(LocalStorage.getItem('LoggedPositions') || [])

const Location = ref()
const LoadingPosition = ref(false)
const watchId = ref(null)
const trackerId = ref(crypto.randomUUID())

let busMap = null
const marker = new Marker({
  subpixelPositioning: true
})

function copyLocation () {
  copyToClipboard(Location.value.latitude + ', ' + Location.value.longitude)
  Notify.create({
    type: 'positive',
    message: 'Copied coordinates!'
  })
}

function moveMarker (coords) {
  marker.setLngLat(coords)

  if (!marker._map && busMap.value) {
    marker.addTo(busMap.value)
    busMap.value.panTo(coords)
  }
}

function mapLoaded (map) {
  busMap = map

  watch(Settings.value, () => {
    const value = Settings.value.ShowLogPath ? 'visible' : 'none'
    map.value.setLayoutProperty('TrackingPath', 'visibility', value)
    map.value.setLayoutProperty('TrackingPoints', 'visibility', value)
  })

  watch(LoggedPositions, () => {
    const geoJSONData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: LoggedPositions.value.map(({ latitude, longitude }) => [longitude, latitude])
      }
    }

    const lineSource = map.value.getSource('TrackingLog')
    if (lineSource) {
      lineSource.setData(geoJSONData)
    } else {
      map.value
        .addSource('TrackingLog', {
          type: 'geojson',
          data: geoJSONData
        })
        .addLayer({
          id: 'TrackingPath',
          type: 'line',
          source: 'TrackingLog',
          layout: {
            visibility: 'visible'
          },
          paint: {
            'line-color': 'limegreen',
            'line-width': 6,
            'line-dasharray': [2, 0.6]
          }
        })
        .addLayer({
          id: 'TrackingPoints',
          type: 'circle',
          source: 'TrackingLog',
          layout: {
            visibility: 'visible'
          },
          paint: {
            'circle-color': 'black',
            'circle-radius': 3,
            'circle-opacity': 0.5
          }
        })
    }
  }, { immediate: true })
}

// Logging implementation

function logPosition (position) {
  if (Settings.value.LoggingEnabled !== true) return

  LoggedPositions.value.push(position)
  triggerRef(LoggedPositions)

  LocalStorage.setItem('LoggedPositions', LoggedPositions.value)
}

function clearLogs () {
  LogFile.value = null
  LoggedPositions.value = []

  LocalStorage.removeItem('LoggedPositions')
}

async function getNumberedName (fileName) {
  const files = (await Filesystem.readdir({
    path: '',
    directory: Directory.Documents
  })).files
  if (!files) { return fileName }

  const name = fileName.slice(0, fileName.lastIndexOf('.'))
  const ext = fileName.slice(fileName.lastIndexOf('.'))
  let iters = 1
  let numberedName = fileName

  while (true) {
    if (!files.some(item => item.name === numberedName)) { return numberedName }
    iters++
    numberedName = `${name}_${iters}${ext}`
  }
}

async function saveLogsToFile () {
  const fileName = 'GPS_Logs.json'
  const data = JSON.stringify(LoggedPositions.value, null, '\t')

  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.requestPermissions()
      const numberedName = await getNumberedName(fileName)
      Filesystem.writeFile({
        path: numberedName,
        data,
        encoding: Encoding.UTF8,
        directory: Directory.Documents
      }).then((file) => {
        Notify.create({
          type: 'positive',
          message: `Saved logs to - ${numberedName}`,
          caption: file.uri
        })
      })
    } catch (err) {
      Notify.create({ type: 'error', message: err.message })
    }
  } else {
    exportFile(fileName, data)
  }
}

function importLogFile () {
  const file = LogFile.value

  if (file.type !== 'application/json') {
    console.error('Invalid file type. Please provide a JSON file.')
    return
  }

  const reader = new FileReader()

  reader.onload = (event) => {
    try {
      const jsonObject = JSON.parse(event.target.result)
      LoggedPositions.value = jsonObject

      LocalStorage.setItem('LoggedPositions', jsonObject)
    } catch (error) {
      console.error('Error parsing JSON: ' + error.message)
    }
  }
  reader.onerror = () => { console.error('Error reading file.') }

  reader.readAsText(file)
}

function confirmLogImport () {
  if (LoggedPositions.value.length > 0) {
    $q.dialog({
      title: 'Replace logs with file?',
      message: "You are about to <span class='text-negative'><strong>permanently delete</strong></span> and replace all existing logs with this newly imported file.",
      html: true,
      ok: { color: 'negative', label: 'Delete Logs', 'no-caps': true },
      cancel: true,
      persistent: true
    }).onCancel(() => {
      LogFile.value = null
    }).onOk(() => {
      importLogFile()
    })
  } else {
    importLogFile()
  }
}

// Tracking functions

function updatePos (position) {
  LoadingPosition.value = false
  Location.value = position

  moveMarker([position.longitude, position.latitude])

  const postData = { id: trackerId.value, position }
  if (Capacitor.isNativePlatform()) {
    CapacitorHttp.post({
      url: apiServers[0] + '/api/trackers',
      headers: {
        'Content-Type': 'application/json'
      },
      data: postData,
      connectTimeout: 5000
    })
      .then((res) => {
        Notify.create({ type: 'positive', message: `status: ${res.status}, ${JSON.stringify(res.data)}` })
      })
      .catch((err) => {
        Notify.create({ type: 'error', message: err.message })
      })
  } else {
    axios.post('/api/trackers', postData).catch((err) => { Notify.create({ type: 'error', message: err.message }) })
  }

  logPosition(position)
}

let Geolocation
let BackgroundGPS
if (Capacitor.isNativePlatform()) {
  BackgroundGPS = registerPlugin('BackgroundGeolocation')
  import('@capacitor/geolocation').then((Module) => {
    Geolocation = Module.Geolocation
  })
} else {
  Geolocation = navigator.geolocation
}

const ErrorCodes = ['PERMISSION_DENIED', 'POSITION_UNAVAILABLE', 'TIMEOUT']
async function beginTracking () {
  LoadingPosition.value = true

  if (Capacitor.isNativePlatform()) {
    BackgroundGPS.addWatcher({
      backgroundTitle: 'Autobuss tiek izsekots',
      backgroundMessage: 'Aizver aplikāciju lai izslēgtu',
      requestPermissions: true
    }, (position, error) => {
      if (error) {
        return Notify.create({ type: 'error', caption: error.code })
      }
      updatePos({
        time: position.time,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        speed: position.speed,
        accuracy: position.accuracy
      })
    }).then((id) => {
      watchId.value = id
    })
    return
  }

  if (Geolocation && watchId.value == null) {
    watchId.value = await Geolocation.watchPosition(
      (position) => {
        const coords = position.coords
        updatePos({
          time: position.timestamp,
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude,
          speed: coords.speed,
          accuracy: coords.accuracy
        })
      },
      (error) => {
        Notify.create({ type: 'error', message: error.message, caption: ErrorCodes[error.code + 1] })
      },
      { enableHighAccuracy: true }
    )
  }
}

function stopTracking () {
  LoadingPosition.value = false
  marker.remove()

  if (watchId.value) {
    if (Capacitor.isNativePlatform()) {
      BackgroundGPS.removeWatcher({ id: watchId.value })
    } else {
      Geolocation.clearWatch(watchId.value)
    }
    watchId.value = null
  }
}
</script>
