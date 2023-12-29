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
        <q-btn color="primary" label="Set" @click="onOKClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'

import L from 'leaflet'
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
  const marker = L.marker(coordinate).addTo(busMap.value.map)
  busMap.value.map.panTo(coordinate)
  busMap.value.map.setZoom(17)

  busMap.value.map.on('click', (e) => {
    marker.setLatLng(e.latlng)
    coordinate = [e.latlng.lat, e.latlng.lng]
  })
}

function onOKClick () {
  onDialogOK(coordinate)
}
</script>
