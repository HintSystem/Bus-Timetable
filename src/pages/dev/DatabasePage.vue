<template>
  <q-page class="q-pt-md column" style="gap: 1rem;">
    <div class="actionbar">
      <div class="row" style="gap: 0.6em">
        <q-select
          standout
          dense
          v-model="selectedDataType"
          :options="dataSelect"
          menu-anchor="top left"
          label="Data type"
          style="width: 10em;"
          popup-content-style="border-radius:18px"
          ref="dSel"
          @popup-hide="$refs.dSel.blur()"
        />

        <template v-for="button in buttons" :key="button.id">
            <q-btn
              unelevated
              no-caps
              v-bind="button.props"
              v-on="button.events"
            >
            </q-btn>
        </template>
      </div>

      <div class="row" style="justify-content: flex-end; flex-grow: 1; gap: 0.4rem;">
        <div class="row" style="align-content: flex-end; gap: 0.4rem">
          <q-badge color="amber-6" v-show="manager.stateCount.edit.value > 0">
            <q-icon name="edit"/>&nbsp;
            {{manager.stateCount.edit.value}}
          </q-badge>
          <q-badge color="green-5" v-show="manager.stateCount.insert.value > 0">
            <q-icon name="add_box"/>&nbsp;
            {{manager.stateCount.insert}}
          </q-badge>
          <q-badge color="red-5" v-show="manager.stateCount.delete.value > 0">
            <q-icon name="delete"/>&nbsp;
            {{manager.stateCount.delete}}
          </q-badge>
        </div>

        <q-btn-dropdown
          unelevated
          rounded
          auto-close
          no-caps
          content-style="border-radius:18px"
          menu-anchor="top right"
          label="Commit"
        >
          <q-list>
            <q-item clickable @click="manager.commitChanges()">
              <q-item-section side>
                <q-icon name="edit"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Commit</q-item-label>
                <q-item-label caption>Save changes made<br>to this data type</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable @click="manager.clearChanges()">
              <q-item-section side>
                <q-icon name="delete"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Clear</q-item-label>
                <q-item-label caption>Clear any changes made<br>to this data type</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <component :is="dataComponent" style="flex: 1" @add-button="addButton"></component>
  </q-page>
</template>

<script setup>
import { ref, shallowRef, watchEffect } from 'vue'

import StopView from 'components/database/StopView.vue'
import RouteView from 'components/database/RouteView.vue'
import dataManager from 'components/database/dataManager.vue'

const DataTypes = {
  Stops: StopView,
  Routes: RouteView
}
const dataSelect = Object.keys(DataTypes)

const selectedDataType = ref(dataSelect[0])
const dataComponent = shallowRef(null)

let manager = dataManager(dataSelect[0])
watchEffect(() => {
  dataComponent.value = DataTypes[selectedDataType.value]
  manager = dataManager(selectedDataType.value)
})

const buttons = shallowRef([])
function addButton (...options) {
  const temp = []
  for (const button of options) {
    button.id = Date.now()
    temp.push(button)
  }
  buttons.value = temp
}
</script>

<style lang="scss">
.actionbar {
  display: flex;
  background: lighten($primary, 35);
  margin: 0 10px 0 10px;
  padding: 5px 6px;
  border-radius: 100vw;

  .q-btn {
    background: $grey-2;
    color: rgba(0, 0, 0, 0.87);
    border-radius: 100vw;
    //min-height: 100%;
  }

  .q-field__control {
    background: $grey-2;
    border-radius: 100vw;
  }

  .q-badge {
    font-size: 0.85rem;
    border-radius: 0.5rem;
  }
}
</style>
