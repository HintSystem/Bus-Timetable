import { defineStore } from 'pinia'

export const useDataStore = defineStore('counter', {
  state: () => ({
    LoadedData: [],
    Changes: {}
  }),
  getters: {
    doubleCount: (state) => state.counter * 2
  },
  actions: {
    increment () {
      this.counter++
    }
  }
})
