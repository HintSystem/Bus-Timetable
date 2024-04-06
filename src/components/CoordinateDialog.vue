<template>
  <q-dialog ref="dialogRef">
    <q-card class="q-dialog-plugin" style="width: 90vw">
      <BusMap
        ref="busMap"
        style="height: 60vh; width: 100%"
        @vue:mounted="onMapMount"
      />
      <q-separator />
      <q-card-actions align="right">
        <q-btn color="primary" label="Set" @click="onDialogOK(coordinate)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'

import { Marker } from 'maplibre-gl'
import BusMap from 'components/BusMap.vue'

const props = defineProps({
  location: {
    type: Array,
    default: BusMap.defaultCenter
  }
})

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogOK } =
  useDialogPluginComponent()

const busMap = ref()
let coordinate = props.location

function onMapMount () {
  const map = busMap.value.map
  const coords = [coordinate[1], coordinate[0]]

  const marker = new Marker().setLngLat(coords).addTo(map)
  map.jumpTo({
    zoom: 17,
    center: coords
  })

  map.on('click', (e) => {
    marker.setLngLat(e.lngLat)
    coordinate = [e.lngLat.lat, e.lngLat.lng]
  })
}
</script>
