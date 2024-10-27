<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title>Bus Tracker</q-toolbar-title>
        <a><b>ip:</b> {{ ip }}</a>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const ip = ref(window.location.host)
</script>
