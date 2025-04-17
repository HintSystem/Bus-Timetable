<template>
  <div
    ref="mapContainer"
    style="background-color: secondary; min-height: inherit; width: 100%"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, h, createApp } from 'vue'
import { Notify, copyToClipboard } from 'quasar'
import { io } from 'socket.io-client'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { Map as MapLibreMap, NavigationControl, Marker, Popup } from 'maplibre-gl'
import { mapCenter } from './constants'
import { parse } from 'papaparse'
import apiRequest from './apiRequest'

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
  tracker: {
    type: Object,
    default () { return { id: null, position: {} } }
  }
})

const tracker = {
  copyLocation () {
    copyToClipboard(props.tracker.position.latitude + ', ' + props.tracker.position.longitude)
    Notify.create({
      type: 'positive',
      message: t('tracking.copyCoords')
    })
  }
}

const mapContainer = ref()
const map = ref()

class TrackerInfoControl {
  constructor () {
    this.container = null
    this.app = null
  }

  onAdd () {
    if (!this.app) {
      this.container = document.createElement('div')
      this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
      this.container.style.cssText = 'user-select: none; font-size: 1.2em; padding: 0.1em 0.25em; opacity: 0.7;'

      const TrackerComponent = {
        setup () {
          return () => h('div', {
            onDblclick: tracker.copyLocation
          }, `lat: ${props.tracker.position?.latitude ?? 'N/A'}\nlong: ${props.tracker.position?.longitude ?? 'N/A'}`)
        }
      }

      this.app = createApp(TrackerComponent)
    }

    this.app.mount(this.container)
    return this.container
  }

  onRemove () { this.app.unmount(); this.container.remove() }
}

function getShape (id) {
  return new Promise((resolve) => {
    apiRequest('/gtfs/shapes')
      .then(res => res.text())
      .then(res => parse(res, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const list = []
          for (const segment of res.data) {
            if (segment.shape_id !== id) continue
            list[segment.shape_pt_sequence] = [parseFloat(segment.shape_pt_lon), parseFloat(segment.shape_pt_lat)]
          }
          resolve(list)
        }
      }))
  })
}

function getStops () {
  return new Promise((resolve) => {
    apiRequest('/gtfs/stops')
      .then(res => res.text())
      .then(res => parse(res, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          resolve(res.data)
        }
      }))
  })
}

const currentPath = ref([])
function setupRoutePath (map) {
  watch(currentPath, () => {
    const geoJSONData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: currentPath.value
      }
    }

    const lineSource = map.getSource('CurrentRoute')
    if (lineSource) {
      lineSource.setData(geoJSONData)
    } else {
      map
        .addSource('CurrentRoute', {
          type: 'geojson',
          data: geoJSONData
        })
        .addLayer({
          id: 'RoutePath_stroke',
          source: 'CurrentRoute',
          type: 'line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-width': 10,
            'line-blur': 2,
            'line-opacity': 0.4
          }
        })
        .addLayer({
          id: 'RoutePath',
          source: 'CurrentRoute',
          type: 'line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': 'limegreen',
            'line-width': 6
          }
        })
    }
  })
}

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

  if (props.tracker.id) { map.value.addControl(new TrackerInfoControl(), 'top-left') }

  setupRoutePath(map.value)

  apiRequest('/gtfs/trips')
    .then(res => res.text())
    .then(res => parse(res, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        getShape(res.data[0].shape_id).then((data) => {
          currentPath.value = data
        })
      }
    }))

  getStops().then(stops => {
    console.log('stops', stops)

    for (const el of stops) {
      const split = el.stop_id.split('.')
      if (split[0] === '1' && el.stop_id !== '00' && el.stop_id !== '01') { continue }

      if (split.length > 1) {
        const dirSplit = split[1].split('-')
        if (dirSplit[0] === '1') { continue }
        if (Number(dirSplit[1]) > 14) { continue }
      }

      new Marker({
        color: '#38ab44'
      })
        .setLngLat([el.stop_lon, el.stop_lat])
        .setPopup(new Popup().setHTML(`<h1 style="font-size:1.65em; font-weight:500; margin:0; line-height:normal">${el.stop_name}</h1>`))
        .addTo(map.value)
    }
  })

  emit('mapMounted', map)
  map.value.on('load', () => { emit('mapLoaded', map) })

  const TrackerMarkers = new Map()
  const socket = io()

  socket.on('location', function onLocationReceived (msg) {
    if (msg.id === props.tracker.id) return
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

  socket.on('tracker_disconnect', (id) => {
    const Marker = TrackerMarkers.get(id)
    if (Marker) {
      Marker.remove()
      TrackerMarkers.delete(id)
    }
  })
})

</script>

<style src="maplibre-gl/dist/maplibre-gl.css"/>
