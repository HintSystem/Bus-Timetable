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
    <q-td key="inbound" :props="props">
      {{props.row.inbound}}
    </q-td>
    <q-td key="outbound" :props="props">
      {{props.row.outbound}}
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
    name: 'inbound',
    field: (row) => row.inbound,
    label: 'Inbound Stops'
  },
  {
    name: 'outbound',
    field: (row) => row.outbound,
    label: 'Outbound Stops'
  }
]

export default {
  props: { props: Object },
  setup () {

  }
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
