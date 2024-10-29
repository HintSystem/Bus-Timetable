<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title>{{ $t('tracking.title') }}</q-toolbar-title>
        <q-select
          v-model="locale"
          :options="localeOptions"
          borderless
          emit-value
          map-options
          style="font-size: large;"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n({ useScope: 'global' })
const localeOptions = [
  { value: 'lv-LV', label: '🇱🇻 Latviešu' },
  { value: 'en-US', label: '🇺🇸 English' }
]
</script>
