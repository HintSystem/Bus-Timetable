<template>
  <div
    ref="mapContainer"
    style="background-color: $secondary; min-height: inherit; width: 100%"
  />
</template>

<script>
import { onMounted, ref } from 'vue'
import L from 'leaflet'

export const defaultCenter = [56.91880187715596, 24.037677432486635]

export default {
  setup () {
    const mapContainer = ref()
    const map = ref()

    onMounted(() => {
      map.value = L.map(mapContainer.value).setView(defaultCenter, 18)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 14,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map.value)
    })

    return {
      mapContainer,
      map
    }
  }
}
</script>

<style src="leaflet/dist/leaflet.css"></style>
