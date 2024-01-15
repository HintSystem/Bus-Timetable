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
          @update:model-value="
            (val) => manager.setValue(props.rowIndex, (row) => { row.name = val })
          "
          :validate="(val) => val.length > 4"
          v-slot="scope"
        >
          <q-input
            v-model="scope.value"
            dense
            autofocus
            counter
            @keyup.enter="scope.set"
            :rules="[
              (val) => scope.validate(val) || 'More than 4 chars required',
            ]"
          />
        </q-popup-edit>
      </q-td>
      <q-td key="location" :props="props">
        <div class="array">[&nbsp;</div>
        <div class="array el">
          {{ props.row.location.coordinates[0].toFixed(4) }}
        </div>
        <div class="array">,&nbsp;</div>
        <div class="array el">
          {{ props.row.location.coordinates[1].toFixed(4) }}
        </div>
        <div class="array">&nbsp;]</div>
        <q-btn
          unelevated
          round
          size="0.9em"
          padding="0.5em"
          color="primary"
          icon="pin_drop"
          style="margin-left: 1em"
          @click.stop="coordDialog(props)"
        />
        <q-popup-edit
          :model-value="coordString(props.row.location.coordinates)"
          @update:model-value="
            (val) => manager.setValue(props.rowIndex, (row) => { row.location.coordinates = coordArray(val) })
          "
          :validate="coordinateValid"
          v-slot="scope"
        >
          <q-input
            v-model="scope.value"
            dense
            autofocus
            @keyup.enter="scope.set"
            :rules="[coordinateRule]"
          />
        </q-popup-edit>
      </q-td>
    </template>
  </data-view>
</template>

<script setup>
import { useQuasar } from 'quasar'

import CoordinateDialog from 'components/CoordinateDialog.vue'
import DataView from './DataView.vue'

import dataManager from './dataManager.vue'
const manager = dataManager('Stops')

const columns = [
  {
    name: 'name',
    field: (row) => row.name,
    label: 'Name',
    required: true,
    align: 'left'
  },
  {
    name: 'location',
    field: (row) => row.location.coordinates,
    label: 'Location [ latitude, longitude ]'
  }
]

function coordinateValid (val) {
  if (coordinateRule(val) === true) {
    return true
  }
  return false
}

function coordinateRule (val) {
  if (!val.includes(',')) {
    return 'Coordinates must be a list seperated with `,`'
  }

  const arr = val
    .split(',')
    .map(parseFloat)
    .filter((item) => !isNaN(item))
  if (arr.length !== 2) {
    return 'Coordinates must contain exactly 2 numbers'
  }

  if (arr[0] < -90 || arr[0] > 90) {
    return 'Latitude must be between -90 and 90'
  }
  if (arr[1] < -180 || arr[1] > 180) {
    return 'Longitude must be between -180 and 180'
  }
  return true
}

function coordString (coords) {
  return `${coords[0]}, ${coords[1]}`
}

function coordArray (string) {
  const arr = string.split(',')
  arr.length = 2
  return arr.map(Number)
}

const $q = useQuasar()
function coordDialog (props) {
  $q.dialog({
    component: CoordinateDialog,
    componentProps: {
      location: props.row.location.coordinates
    }
  }).onOk((newCoords) => {
    manager.setValue(props.rowIndex, (row) => { row.location.coordinates = newCoords })
  })
}
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
