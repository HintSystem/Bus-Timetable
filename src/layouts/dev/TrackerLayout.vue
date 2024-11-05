<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title>{{ $t('tracking.title') }}</q-toolbar-title>
        <LanguageSelect/>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import LanguageSelect from 'src/components/LanguageSelect.vue'
</script>
