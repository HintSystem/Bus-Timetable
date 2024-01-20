<template>
  <data-view
    :dataManager="manager"
    :columns="columns"
  >
    <template #rows="props">
      <q-td key="name" :props="props">
        {{ props.row.name }}
        <q-popup-edit
          :model-value="props.row.name"
          @update:model-value="(val) => { manager.setValue(props.rowIndex, (row) => { row.name = val } )}"
          :validate="(val) => val.length >= 1"
          v-slot="scope"
        >
          <q-input
            v-model="scope.value"
            dense
            autofocus
            @keyup.enter="scope.set"
            :rules="[
              (val) => scope.validate(val) || 'At least 1 character required',
            ]"
          />
        </q-popup-edit>
      </q-td>
      <q-td key="inbound" :props="props">
        {{props.row.inbound}}
      </q-td>
      <q-td key="outbound" :props="props">
        {{props.row.outbound}}
      </q-td>
    </template>
  </data-view>
</template>

<script setup>
import { shallowRef } from 'vue'

import DataView from './DataView.vue'
import dataManager from './dataManager.vue'
const manager = dataManager('Routes', { name: 'Route name', inbound: [], outbound: [] })

const columns = shallowRef([
  {
    name: 'name',
    field: (row) => row.name,
    label: 'Name',
    required: true,
    align: 'left'
  },
  {
    name: 'inbound',
    field: (row) => row.inbound,
    label: 'Inbound Stops'
  },
  {
    name: 'outbound',
    field: (row) => row.outbound,
    label: 'Outbound Stops'
  }
])
</script>
