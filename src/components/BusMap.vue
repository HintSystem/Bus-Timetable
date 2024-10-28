<template>
  <div
    ref="mapContainer"
    style="background-color: secondary; min-height: inherit; width: 100%"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'

import { Map as MapLibreMap, NavigationControl, Marker } from 'maplibre-gl'
import { mapCenter } from './constants'

function hslToHex (h, s, l) {
  l /= 100
  const a = s * Math.min(l, 1 - l) / 100
  const f = n => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0') // convert to Hex and prefix "0" if needed
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const emit = defineEmits(['mapMounted', 'mapLoaded'])
const props = defineProps({
  idBlacklist: String
})

const mapContainer = ref()
const map = ref()

onMounted(() => {
  map.value = new MapLibreMap({
    container: mapContainer.value,
    center: mapCenter,
    minZoom: 13,
    maxZoom: 19
  })
    .addSource('osm', {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
    .addLayer({
      id: 'canvas',
      type: 'raster',
      source: 'osm'
    })
    .addControl(new NavigationControl(), 'top-right')

  emit('mapMounted', map)
  map.value.on('load', () => { emit('mapLoaded', map) })

  const TrackerMarkers = new Map()
  const socket = io()

  socket.on('location', (msg) => {
    if (msg.id === props.idBlacklist) return
    console.log('tracker location:', msg)

    let LocationMarker = TrackerMarkers.get(msg.id)
    if (!LocationMarker) {
      const hue = (parseInt(msg.id, 36) % 720) / 2

      LocationMarker = new Marker({
        color: hslToHex(hue, 80, 60)
      }).setLngLat([0, 0]).addTo(map.value)

      TrackerMarkers.set(msg.id, LocationMarker)
    }

    LocationMarker.setLngLat([msg.position.longitude, msg.position.latitude])
  })

  socket.on('tracker_disconnect', (msg) => {
    const Marker = TrackerMarkers.get(msg)
    if (Marker) {
      Marker.remove()
      TrackerMarkers.delete(msg)
    }
  })
})

</script>

<style src="maplibre-gl/dist/maplibre-gl.css"/>
