<template>
  <q-select
    v-model="locale"
    :options="localeOptions"
    borderless
    emit-value
    map-options
    style="font-size: large;"
  />
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n({ useScope: 'global' })
const localeOptions = [
  { value: 'lv', label: '🇱🇻 Latviešu' },
  { value: 'en-US', label: '🇺🇸 English' }
]
</script>
