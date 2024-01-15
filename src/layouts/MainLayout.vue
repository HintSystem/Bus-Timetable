<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Autobusu saraksts </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen"
      show-if-above
      elevated
      :width="220"
    >
      <q-list>
        <template v-for="(menuItem, index) in linksList" :key="index">
          <q-item clickable :active="menuItem.title === 'Outbox'" v-ripple>
            <q-item-section avatar>
              <q-icon :name="menuItem.icon" />
            </q-item-section>
            <q-item-section>
              {{ menuItem.title }}
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'

const linksList = [
  {
    title: 'Karte',
    icon: 'map',
    link: 'https://quasar.dev'
  },
  {
    title: 'Laika grafiks',
    icon: 'schedule',
    link: 'https://github.com/quasarframework'
  },
  {
    title: 'Autobusa Vēsture',
    icon: 'history',
    link: 'https://chat.quasar.dev'
  },
  {
    title: 'Iestatījumi',
    icon: 'settings',
    link: 'https://twitter.quasar.dev'
  },
  {
    title: 'Palīdzība',
    icon: 'info',
    link: 'https://facebook.quasar.dev'
  }
]

export default defineComponent({
  name: 'MainLayout',

  setup () {
    const leftDrawerOpen = ref(false)

    return {
      linksList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  }
})
</script>
