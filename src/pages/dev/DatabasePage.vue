<template>
  <q-page padding style="display: flex; flex-direction: column; gap: 1rem;">
    <q-select
        outlined
        v-model="SelectedDataModel"
        :options="DataSelect"
        label="Data type"
        style="width: 15em;"
    />
    <q-table
      class="q-auto"
      :rows="Collection"
      :columns="DataColumns"
      :rows-per-page-options="[15, 25, 35, 0]"
      style="flex: 1;"
    >
      <template #body="props">
        <component :is="DataComponent" :props="props"></component>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import axios from 'axios'
import { ref, shallowRef, watch } from 'vue'

import StopItem, { columns as StopColumns } from 'components/database/StopItem.vue'
import RouteItem, { columns as RouteColumns } from 'components/database/RouteItem.vue'

const DataTypes = {
  Stops: [StopItem, StopColumns],
  Routes: [RouteItem, RouteColumns]
}
const DataSelect = Object.keys(DataTypes)

const Collection = ref([])
// const CollectionEdited = ref([])

const SelectedDataModel = ref('Stops')
const DataComponent = shallowRef(null)
const DataColumns = ref([])

function changeDataModel (model) {
  DataComponent.value = DataTypes[model][0]
  DataColumns.value = DataTypes[model][1]
  Collection.value = []
  axios(`/api/${model}`).then((response) => {
    console.log('%c[API] response received', 'color:lightgreen')
    Collection.value = response.data
  })
}
changeDataModel(SelectedDataModel.value)

watch(SelectedDataModel, (newModel) => {
  changeDataModel(newModel)
})
</script>

<style scoped lang="scss">
.array {
  display: inline;
  color: $grey-7;
}

.array.el {
  color: $blue;
}
</style>
