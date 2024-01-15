<script>
import { shallowRef, ref, computed } from 'vue'

import axios from 'axios'
import { produce, enablePatches, enableMapSet } from 'immer'
enablePatches()
enableMapSet()

function initDataModel () {
  const dataModel = {
    data: shallowRef([]),
    edit: shallowRef(new Map()),
    delete: shallowRef(new Map()),
    insert: shallowRef(new Map())
    // saved: shallowRef({}),
  }

  const stateCount = {
    edit: computed(() => { return dataModel.edit.value.size }),
    delete: computed(() => { return dataModel.delete.value.size }),
    insert: computed(() => { return dataModel.insert.value.size }),
    total: computed(() => { return stateCount.edit.value + stateCount.delete.value + stateCount.insert.value })
  }
  dataModel.stateCount = stateCount

  return dataModel
}

function setPathValue (entry, path, val) {
  let last = entry
  for (const [i, property] of path.entries()) {
    if (i === path.length - 1) {
      last[property] = val
      break
    }

    if (property in last === false) last[property] = {}
    last = last[property]
  }
}

// Converts a single key into an array of keys
function parseKeys (key) {
  if (typeof key === 'string') {
    return [key]
  } else if (typeof key !== 'object') console.error('Key with type `%s` is not supported', typeof key)

  return key
}

const dataModels = {}

export default (dataType) => {
  if (dataType === undefined) console.error('No data type defined for dataManager')

  dataModels[dataType] ||= initDataModel()
  const dataModel = dataModels[dataType]

  const loading = ref(false)
  const stateCount = dataModel.stateCount

  const keyEdited = (key) => {
    if (dataModel.edit.value.has(key)) return true
    return false
  }

  const stateFromKey = (key) => {
    if (dataModel.delete.value.has(key)) return 'delete'
    if (dataModel.insert.value.has(key)) return 'insert'

    if (dataModel.edit.value.has(key)) return 'edit'
    return undefined
  }

  const resetItem = (keys) => {
    keys = parseKeys(keys)

    dataModel.edit.value = produce(dataModel.edit.value, draft => {
      for (const key of keys) {
        draft.delete(key)
      }
    })
  }

  const markDeleted = (keys, bool) => {
    keys = parseKeys(keys)

    dataModel.delete.value = produce(dataModel.delete.value, draft => {
      for (const key of keys) {
        if (bool) { draft.set(key, true); continue }
        draft.delete(key)
      }
    })
  }

  const setValue = (index, callback) => {
    dataModel.data.value = produce(
      dataModel.data.value,
      draft => {
        callback(draft[index], draft)
      },
      (patches) => {
        dataModel.edit.value = produce(dataModel.edit.value, draft => {
          for (const patch of patches) {
            const id = dataModel.data.value[patch.path[0]]._id
            if (!draft.has(id)) draft.set(id, {})

            const entry = draft.get(id)
            setPathValue(entry, patch.path.slice(1), patch.value)
          }
        })
        console.log('patch', dataModel.edit.value)
      }
    )
  }

  const queryData = () => {
    loading.value = true
    axios(`/api/${dataType}`).then((response) => {
      console.log('%c[API] response received for %c`%s`', 'color:green', 'color:red', dataType)

      // needs to be done every time data is requested, otherwise edits won't be displayed when refreshed
      dataModel.data.value = response.data.map(item => {
        if (keyEdited(item._id)) {
          return { ...item, ...dataModel.edit.value.get(item._id) } // spread operator replaces any conflicting values with the new values of edit
        }
        return item
      })
      loading.value = false
    })
  }

  return {
    dataModel,
    loading,
    stateCount,
    stateFromKey,
    resetItem,
    markDeleted,
    setValue,
    queryData
  }
}

</script>
