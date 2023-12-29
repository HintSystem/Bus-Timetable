<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-tr :props="props">
    <q-td key="name" :props="props">
      {{ props.row.name }}
      <q-popup-edit
        v-model="props.row.name"
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
        size="0.85em"
        color="primary"
        icon="pin_drop"
        style="margin-left: 1em"
        @click.stop="coordDialog(props.row.location)"
      />
      <q-popup-edit
        :model-value="coordString(props.row.location.coordinates)"
        @update:model-value="
          (value) => (props.row.location.coordinates = coordArray(value))
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
  </q-tr>
</template>

<script>
export const columns = [
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
</script>

<script setup>
import { useQuasar } from 'quasar'
import CoordinateDialog from 'components/CoordinateDialog.vue'

defineProps({
  props: Object
})

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
function coordDialog (locationValue) {
  $q.dialog({
    component: CoordinateDialog,
    componentProps: {
      location: locationValue.coordinates
    }
  }).onOk((newCoords) => {
    locationValue.coordinates = newCoords
    console.log(newCoords)
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
