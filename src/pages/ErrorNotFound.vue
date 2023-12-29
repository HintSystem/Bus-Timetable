<template>
  <div
    class="fullscreen bg-secondary text-white text-center q-pa-md flex flex-center"
  >
    <div>
      <div style="font-size: 30vh; line-height: 28vh">404</div>

      <div class="text-h4" style="opacity: 0.45">Oops. Nothing here...</div>

      <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Go Home"
        no-caps
        rounded
        size="xl"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ErrorNotFound'
})
</script>
