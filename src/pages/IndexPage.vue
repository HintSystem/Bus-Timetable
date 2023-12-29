<template>
  <q-page :padding="false">
    <BusMap />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import BusMap from 'components/BusMap.vue'

export default defineComponent({
  name: 'IndexPage',

  components: {
    BusMap
  }
})
</script>
