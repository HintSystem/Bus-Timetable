<template>
  <q-page padding>
    <q-btn
      label="Start tracking"
      @click="beginTracking"
      color="primary"
      size="1rem"
      rounded
      no-caps
    />
    lat: {{Location.latitude}}
    long: {{Location.longitude}}
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const Location = ref({
  latitude: 0,
  longitude: 0
})

function beginTracking () {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
      Location.value = position.coords
    })
  }
}

</script>
