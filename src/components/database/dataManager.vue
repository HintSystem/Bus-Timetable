<script>
import { shallowRef, ref, computed } from 'vue'

import axios from 'axios'
import { produce, setAutoFreeze, enablePatches, enableMapSet } from 'immer'

// auto freeze prevents us from clearing all changes
setAutoFreeze(false)
enablePatches()
enableMapSet()

function initDataModel () {
  const dataModel = {
    data: shallowRef([]),
    edit: shallowRef(new Map()),
    delete: shallowRef(new Map()),
    insert: shallowRef(new Map())
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
  if (typeof key === 'string' || typeof key === 'number') {
    return [key]
  } else if (typeof key !== 'object') console.error('Key with type `%s` is not supported', typeof key)

  return key
}

const dataModels = {}
let insertCount = 0

export default (dataType, defaultRow) => {
  if (dataType === undefined) console.error('No data type defined for dataManager')

  dataModels[dataType] ||= initDataModel()
  const dataModel = dataModels[dataType]

  const data = computed(() => {
    return [...dataModel.data.value, ...dataModel.insert.value.values()]
  })

  const apiURL = `/api/${dataType}`
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
    return 'data'
  }

  const setDefault = (row) => {
    dataModel.defaultRow = row
  }
  if (defaultRow && dataModel.defaultRow === undefined) setDefault(defaultRow)

  const clearChanges = () => {
    // using map.clear() would be preferred, however it doesn't update the shallowRef
    dataModel.edit.value = new Map()
    queryData()

    dataModel.insert.value = new Map()
    dataModel.delete.value = new Map()
  }

  const resetItem = (keys) => {
    keys = parseKeys(keys)

    dataModel.edit.value = produce(dataModel.edit.value, draft => {
      for (const key of keys) {
        draft.delete(key)
      }
    })
  }

  // Run a function based on the key's state
  // If no function exists for the grouped state, then it will be sent to remainder instead
  function stateAction (keys, options) {
    keys = Object.groupBy(parseKeys(keys), key => {
      const state = stateFromKey(key)
      if (state in options) {
        return state
      }
      return 'remainder'
    })

    for (const state in keys) {
      if (state in options) {
        options[state](keys[state])
      }
    }
  }

  const markDeleted = (keys, bool) => {
    const actions = {
      remainder (actionKeys) {
        dataModel.delete.value = produce(dataModel.delete.value, draft => {
          for (const key of actionKeys) {
            if (bool) { draft.set(key, true); continue }
            draft.delete(key)
          }
        })
      },

      insert (actionKeys) {
        dataModel.insert.value = produce(dataModel.insert.value, draft => {
          for (const key of actionKeys) draft.delete(key)
        })
      }
    }

    stateAction(keys, actions)
  }

  const addRow = () => {
    if (dataModel.defaultRow === undefined) { console.error('Can\'t insert a new row when default row isn\'t set'); return }

    dataModel.insert.value = produce(dataModel.insert.value, draft => {
      insertCount++

      draft.set(insertCount, { ...dataModel.defaultRow, _id: insertCount })
    })
  }

  const setValue = (index, callback) => {
    // Index is not present because it's an inserted element
    if (dataModel.data.value[index] === undefined) {
      const id = data.value[index]._id
      dataModel.insert.value = produce(dataModel.insert.value, draft => {
        callback(draft.get(id), draft)
      })
      return
    }

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

  const commitChanges = async () => {
    if (dataModel.stateCount.delete.value > 0) {
      const deleteArray = Array.from(dataModel.delete.value.keys())
      await axios.delete(apiURL, { data: { id: deleteArray } })
    }

    if (dataModel.stateCount.insert.value > 0) {
      const insertArray = Array.from(dataModel.insert.value, ([_, value]) => {
        // destructure and remove _id because otherwise mongoose will try to create a new document with this temporary id
        const { _id, ...noId } = value
        return noId
      })
      console.log(insertArray)
      await axios.post(apiURL, { objects: insertArray })
    }

    clearChanges()
  }

  const queryData = async () => {
    loading.value = true
    await axios.get(apiURL).then((response) => {
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
    data,
    loading,
    stateCount,
    stateFromKey,
    setDefault,
    clearChanges,
    resetItem,
    markDeleted,
    addRow,
    setValue,
    commitChanges,
    queryData
  }
}

</script>
