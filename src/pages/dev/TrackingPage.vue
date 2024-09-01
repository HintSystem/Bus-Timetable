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
      ref="busMap"
      style="min-height: none; border-radius: 6px"
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
import { ref, shallowRef, triggerRef, watchEffect, watch } from 'vue'
import { useQuasar, Notify, LocalStorage, copyToClipboard, exportFile } from 'quasar'

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

const busMap = ref()
const marker = new Marker()

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

  if (!marker._map) {
    const map = busMap.value.map

    marker.addTo(map)
    map.panTo(coords)
  }
}

watchEffect(() => {
  if (!Location.value) return
  moveMarker([Location.value.longitude, Location.value.latitude])
})

function mapLoaded (map) {
  watch(LoggedPositions, () => {
    const geoJSON = {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: LoggedPositions.value.map(({ latitude, longitude }) => [longitude, latitude])
        }
      }
    }

    console.log(geoJSON)

    const lineSource = map.value.getSource('TrackingLog')
    if (lineSource) {
      lineSource.setData(geoJSON)
    } else {
      console.log('new source')
      map.value.addSource('TrackingLog', geoJSON)
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
  if (!LoggingEnabled.value) return

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
      console.log(LoggedPositions.value)
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
const socket = io('/track', { autoConnect: false })

function beginTracking () {
  LoadingPosition.value = true
  socket.connect()

  if (navigator.geolocation && watchId.value == null) {
    watchId.value = navigator.geolocation.watchPosition(
      (position) => {
        LoadingPosition.value = false

        Location.value = position.coords
        const dict = geolocationDict(position)
        socket.emit('location', dict)

        logPosition(dict)
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
  socket.disconnect()
  if (watchId.value) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }
}
</script>
