import { Notify, LocalStorage } from 'quasar'
import { CapacitorHttp, Capacitor } from '@capacitor/core'
import { apiServers } from 'components/constants'

let lastSuccessIndex = 0
// if (localStorage.getItem('apiIndex') > 0) {
//   lastSuccessIndex = LocalStorage.getItem('apiIndex')
// }

let findServerPromise = null
function findServer () {
  if (!findServerPromise) {
    findServerPromise = (async () => {
      for (const index in apiServers) {
        if (index === lastSuccessIndex) continue

        try {
          const res = await CapacitorHttp.request({ url: apiServers[index] + '/status', connectTimeout: 900 })

          if (res.status === 200) {
            lastSuccessIndex = index
            LocalStorage.setItem('apiIndex', index)
            Notify.create({ message: `FOUND SERVER! ${index}, ${apiServers[index]}` })
            return (index, res)
          }
        } catch {}
      }

      throw new Error('No servers found')
    })()

    findServerPromise.finally(() => {
      findServerPromise = null
    })
  }

  return findServerPromise
}

function apiRequest (url, options, forceNative) {
  return new Promise((resolve, reject) => {
    if (Capacitor.isNativePlatform()) {
      url = apiServers[lastSuccessIndex] + url
    } else {
      url = '/api' + url
    }

    if (forceNative && Capacitor.isNativePlatform()) {
      CapacitorHttp.request({
        url,
        connectTimeout: 1200,
        ...options
      }).then(resolve)
        .catch((err) => {
          Notify.create({ type: 'error', message: err.message })
          findServer()
          reject(err)
        })
    } else {
      fetch(url, options)
        .then(resolve)
        .catch((err) => {
          Notify.create({ type: 'error', message: err.message })
          findServer()
          reject(err)
        })
    }
  })
}

export default apiRequest
