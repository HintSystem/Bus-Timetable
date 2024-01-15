<template>
  <q-table
    class="q-auto"
    v-bind="props"
    row-key="_id"
    :rows="unref(rows)"
    :loading="unref(manager.loading)"
    :rows-per-page-options="[15, 25, 35, 0]"
    flat
  >

    <template #body="scope">
      <slot
        name="body"
        v-bind="scope"
      >
        <q-tr :props="scope" :class="getState(scope)">
          <q-menu touch-position context-menu auto-close>
            <q-list dense>
              <q-item clickable @click="manager.markDeleted(scope.key, scope.state !== 'delete')">
                <q-item-section side>
                  <q-icon :name="scope.state === 'delete' ? 'restore_from_trash' : 'delete'" color="negative"/>
                </q-item-section>
                <q-item-section class="text-negative">{{ scope.state === 'delete' ? 'Unmark deleted' : 'Mark deleted'}}</q-item-section>
              </q-item>

              <q-separator/>

              <q-item clickable @click="copyToClipboard(scope.row._id)">
                <q-item-section side>
                  <q-icon name="content_copy" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption lines="1">{{ scope.row._id }}</q-item-label>
                  <q-item-label>Copy id</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <slot name="rows" v-bind="scope"/>
        </q-tr>
      </slot>
    </template>

    <template v-for="(_, slot) in slots" :key="slot" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" :key="slot"/>
    </template>
  </q-table>
</template>

<script setup>
import { useSlots, unref, ref } from 'vue'
import { QTable, copyToClipboard } from 'quasar'

import _dataManager from './dataManager.vue'

// const emits = defineEmits(QTable.emits)
const props = defineProps({
  ...QTable.props,
  dataManager: Object, // specify data manager if you want control over it
  dataModel: String
})

const overrideSlots = ['body']
const receivedSlots = useSlots()
const slots = ref([])

for (const slot in receivedSlots) {
  if (overrideSlots.includes(slot)) continue
  slots.value.push(slot)
}

let manager
if (props.dataManager) {
  manager = props.dataManager
} else {
  manager = _dataManager(props.dataModel)
}

manager.queryData()
const _dataModel = manager.dataModel
const rows = _dataModel.data

function getState (scope) {
  const state = manager.stateFromKey(scope.key)
  scope.state = state
  return state
}
</script>

<style scoped lang="scss">
tr {
  &.edit {
    background: lighten($amber-5, 28);
  }

  &.delete {
    background: lighten($red-5, 28);
  }
}

.array {
  display: inline;
  color: $grey-7;
}

.array.el {
  color: $blue;
}
</style>
