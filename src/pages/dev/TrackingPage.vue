<template>
  <q-page padding class="column">
    <div class="row" style="padding-bottom: 1rem;">
      <q-btn
        :label='watchId ? "Stop tracking" : "Start tracking"'
        :color='watchId ? "negative" : "positive"'
        @click='watchId ? stopTracking() : beginTracking()'
        size="1rem"
        rounded
        no-caps
      />
      <div v-if="Location">
        lat: {{Location.latitude}} <br>
        long: {{Location.longitude}}
      </div>
    </div>
    <BusMap class="col" ref="busMap" style="min-height: none; border-radius: 6px"/>
  </q-page>
</template>

<script setup>
import { ref, watchEffect } from 'vue'

import { Marker } from 'maplibre-gl'
import BusMap from 'src/components/BusMap.vue'

const Location = ref()
const watchId = ref(null)

const busMap = ref()
const marker = new Marker()

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

function beginTracking () {
  if (navigator.geolocation && watchId.value == null) {
    watchId.value = navigator.geolocation.watchPosition((position) => {
      Location.value = position.coords
    })
  }
}

function stopTracking () {
  if (watchId.value) {
    navigator.geolocation.clearWatch(watchId)
    watchId.value = null
  }
}
</script>
