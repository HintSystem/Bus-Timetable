<template>
  <div
    class="fullscreen bg-secondary text-white text-center q-pa-md flex flex-center"
    style="font-size: 3.5vh; user-select: none;"
  >
    <div>
      <div style="font-size: 14em; line-height: 90%;">404</div>

      <div style="font-size: 1.8em; opacity: 0.45">Oops. Nothing here...</div>

      <q-btn
        class="q-mt-xl"
        to="/"
        label="Go Home"
        no-caps
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

<style scoped lang="scss">
.q-btn {
  background: lighten($secondary, 18);
  color: $primary;
  border-radius: 100vh;
}
</style>
