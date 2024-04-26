<template>
  <div
    ref="mapContainer"
    style="background-color: secondary; min-height: inherit; width: 100%"
  />
</template>

<script>
import { onMounted, ref } from 'vue'
import { Map as MapLibreMap, NavigationControl, Marker } from 'maplibre-gl'

import { mapCenter } from './constants'

import { io } from 'socket.io-client'

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

export default {
  setup () {
    const mapContainer = ref()
    const map = ref()

    const socket = io()

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
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        })
        .addLayer({
          id: 'canvas',
          type: 'raster',
          source: 'osm'
        })
        .addControl(new NavigationControl(), 'top-right')

      const Markers = new Map()

      socket.on('location', (msg) => {
        console.log(msg)

        let LocationMarker = Markers.get(msg.id)
        if (!LocationMarker) {
          LocationMarker = new Marker({
            color: hslToHex((parseInt(msg.id, 36) % 720) / 2, 80, 60)
          }).setLngLat([0, 0]).addTo(map.value)
          Markers.set(msg.id, LocationMarker)
        }

        LocationMarker.setLngLat([msg.longitude, msg.latitude])
      })

      socket.on('tracker_disconnect', (msg) => {
        const Marker = Markers.get(msg)
        if (Marker) {
          Marker.remove()
          Markers.delete(msg)
        }
      })
    })

    return {
      mapContainer,
      map
    }
  }
}
</script>

<style src="maplibre-gl/dist/maplibre-gl.css"/>
