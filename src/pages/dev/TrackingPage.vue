<template>
  <q-page padding class="column">
    <div class="row" style="padding-bottom: 1rem; gap: 0.5rem;">
      <q-btn
        :label='watchId ? "Stop tracking" : "Start tracking"'
        :color='watchId ? "negative" : "positive"'
        @click='watchId ? stopTracking() : beginTracking()'
        size="1rem"
        rounded
        no-caps
      />
      <div
        v-if="Location"
        @dblclick="copyLocation"
        style="user-select: none;"
      >
        lat: {{Location.latitude}} <br>
        long: {{Location.longitude}}
      </div>
    </div>
    <BusMap class="col" ref="busMap" style="min-height: none; border-radius: 6px"/>
  </q-page>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { Notify, copyToClipboard } from 'quasar'

import { Marker } from 'maplibre-gl'
import BusMap from 'src/components/BusMap.vue'

import { io } from 'socket.io-client'

const Location = ref()
const watchId = ref(null)

const busMap = ref()
const marker = new Marker()

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

function notifyError (opts) {
  Notify.create({
    progress: true,
    position: 'bottom-right',
    color: 'negative',
    icon: 'error',
    ...opts
  })
}

const ErrorCodes = ['PERMISSION_DENIED', 'POSITION_UNAVAILABLE', 'TIMEOUT']
const socket = io('/track')

function geolocationDict (coords) {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude,
    speed: coords.speed,
    accuracy: coords.accuracy
  }
}

function beginTracking () {
  if (navigator.geolocation && watchId.value == null) {
    watchId.value = navigator.geolocation.watchPosition(
      (position) => {
        Location.value = position.coords
        socket.emit('location', geolocationDict(position.coords))
      }, (error) => {
        notifyError({ message: error.message, caption: ErrorCodes[error.code + 1] })
      }, { enableHighAccuracy: true }
    )
  }
}

function stopTracking () {
  if (watchId.value) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }
}
</script>
