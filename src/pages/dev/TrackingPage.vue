<template>
  <q-page padding class="column">
    <div class="row" style="padding-bottom: 1rem; gap: 0.5rem; max-height: 4rem;">
      <q-btn
        :label='watchId ? "Stop tracking" : "Start tracking"'
        :color='watchId ? "negative" : "positive"'
        @click='watchId ? stopTracking() : beginTracking()'
        size="1rem"
        rounded
        no-caps
      >
        <q-spinner-radio v-if="LoadingPosition" style="margin-left: 0.4em;" ></q-spinner-radio>
      </q-btn>
      <div class="row" style="margin-left: auto; gap: 0.5rem">
        <q-checkbox v-model="LoggingEnabled" label="Log location"/>
        <q-btn
          @click="saveLogsToFile"
          icon="save"
          v-show="LoggingEnabled && LoggedPositions.length > 0"
          :label="'(' + LoggedPositions.length + ')'"
        >
          <q-tooltip>Save logs to JSON</q-tooltip>
        </q-btn>
        <q-file
          v-model="LogFile"
          @update:model-value="confirmLogImport"
          v-show="LoggingEnabled"
          accept="application/json"
          standout
          dense
        >
          <template v-slot:prepend>
            <q-icon name="upload_file"/>
          </template>
          <q-tooltip>Upload JSON location logs</q-tooltip>
        </q-file>
        <q-btn
          @click="clearLogs"
          v-show="LoggedPositions.length > 0"
          color="negative"
          icon="delete"
          padding="0.5rem"
          flat
        >
          <q-tooltip>Clear location logs</q-tooltip>
        </q-btn>
      </div>
    </div>
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
import { Capacitor } from '@capacitor/core'

let Geolocation
if (Capacitor.isNativePlatform()) {
  import('@capacitor/geolocation').then((Module) => {
    Geolocation = Module.Geolocation
  })
} else {
  Geolocation = navigator.geolocation
}

import { Marker } from 'maplibre-gl'
import BusMap from 'src/components/BusMap.vue'

import { io } from 'socket.io-client'

const $q = useQuasar()

const LoggingEnabled = ref(false)
const LogFile = ref(null)
const LoggedPositions = shallowRef(LocalStorage.getItem('LoggedPositions') || [])

const Location = ref()
const LoadingPosition = ref(false)
const watchId = ref(null)
const trackerId = ref(null)

let busMap = null
const marker = new Marker({
  subpixelPositioning: true
})

function trackingError (opts) {
  Notify.create({
    progress: true,
    position: 'bottom-right',
    color: 'negative',
    icon: 'error',
    ...opts
  })
}

function copyLocation () {
  copyToClipboard(Location.value.latitude + ', ' + Location.value.longitude)
  Notify.create({
    color: 'positive',
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
  if (LoggingEnabled.value !== true) return

  LoggedPositions.value.push(position)
  triggerRef(LoggedPositions)

  LocalStorage.setItem('LoggedPositions', LoggedPositions.value)
}

function clearLogs () {
  LoggedPositions.value = []

  LocalStorage.removeItem('LoggedPositions')
}

function saveLogsToFile () {
  exportFile('GPS_Logs.json', JSON.stringify(LoggedPositions.value, null, '\t'))
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
      title: 'Are you sure?',
      message: "You are about to <span class='text-negative'><strong>permanently delete</strong></span> and replace all existing logs with this newly imported file.",
      html: true,
      ok: { color: 'negative', label: 'Yes I am sure', 'no-caps': true },
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

const socket = io('/trackers', { autoConnect: false })

socket.on('connect', () => {
  trackerId.value = socket.id
})

function geolocationDict (position) {
  const coords = position.coords
  return {
    timestamp: position.timestamp,
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude,
    speed: coords.speed,
    accuracy: coords.accuracy
  }
}

const ErrorCodes = ['PERMISSION_DENIED', 'POSITION_UNAVAILABLE', 'TIMEOUT']
async function beginTracking () {
  LoadingPosition.value = true
  socket.connect()

  if (Capacitor.isNativePlatform()) {
    let permissionFailed = false
    await Geolocation.requestPermissions({ permissions: ['location'] }).catch(() => {
      permissionFailed = true
      trackingError({ message: 'Location service is disabled', caption: ErrorCodes[0] })
    })
    if (permissionFailed) return stopTracking()
  }

  if (Geolocation && watchId.value == null) {
    watchId.value = Geolocation.watchPosition(
      (position) => {
        LoadingPosition.value = false
        Location.value = position.coords

        moveMarker([position.coords.longitude, position.coords.latitude])

        const posLogData = geolocationDict(position)
        socket.emit('location', posLogData)
        logPosition(posLogData)
      },
      (error) => {
        trackingError({ message: error.message, caption: ErrorCodes[error.code + 1] })
      },
      { enableHighAccuracy: true }
    )
  }
}

function stopTracking () {
  LoadingPosition.value = false
  marker.remove()

  socket.disconnect()
  trackerId.value = null

  if (watchId.value) {
    if (Capacitor.isNativePlatform()) {
      Geolocation.clearWatch({ id: watchId.value }) // Capacitor api requires an option instead
    } else {
      Geolocation.clearWatch(watchId.value)
    }
    watchId.value = null
  }
}
</script>
