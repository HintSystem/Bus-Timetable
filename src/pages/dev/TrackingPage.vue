<template>
  <q-page padding class="column">
    <div class="row justify-center q-pb-md" style="gap: 0.5rem">
      <q-btn
        @click='watchId ? stopTracking() : beginTracking()'
        :label='watchId ? $t("tracking.stop") : $t("tracking.start")'
        :color='watchId ? "negative" : "positive"'
        size="1rem"
        rounded
        no-caps
      >
        <q-spinner-radio v-if="LoadingPosition" style="margin-left: 0.4em;" ></q-spinner-radio>
      </q-btn>
      <q-btn
        @click="SettingsVisible = true"
        icon="settings"
        round
      >
        <q-badge
          v-show="LogPlayer.Running.value"
          rounded
          floating
          color="amber"
        />
      </q-btn>
    </div>

    <q-dialog v-model="SettingsVisible">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('settings') }}</div>
        </q-card-section>

        <q-separator inset/>
        <q-item-label header>{{ $t('debug') }}</q-item-label>

        <q-item tag="label">
          <q-item-section>{{ $t('tracking.showLogPath') }}</q-item-section>
          <q-item-section avatar>
            <q-checkbox v-model="Settings.ShowLogPath"/>
          </q-item-section>
        </q-item>

        <q-separator inset/>
        <q-item-label header>{{ $t('logging') }}</q-item-label>

        <q-item tag="label">
          <q-item-section>{{ $t('tracking.enableLogging') }}</q-item-section>
          <q-item-section avatar>
            <q-checkbox v-model="Settings.LoggingEnabled"/>
          </q-item-section>
        </q-item>

        <q-item tag="label">
          <q-item-section>{{ $t('tracking.importLogs') }}</q-item-section>
          <q-item-section avatar>
            <q-file
              v-model="LogFile"
              @update:model-value="confirmLogImport"
              :style="[LogFile ? {} : {'width': '100px'}]"
              accept="application/json"
              standout
              dense
            >
              <template v-slot:prepend>
                <q-icon name="upload_file"/>
              </template>
            </q-file>
          </q-item-section>
        </q-item>

        <q-item tag="label" v-show="LoggedPositions.length > 0">
          <q-item-section>{{ $t('tracking.saveLogs') }}</q-item-section>
          <q-item-section avatar>
            <q-btn
              @click="saveLogsToFile"
              icon="save"
              :label="'(' + LoggedPositions.length + ')'"
            />
          </q-item-section>
        </q-item>

        <q-item tag="label" v-show="LoggedPositions.length > 0">
          <q-item-section>{{ $t('tracking.clearLogs') }}</q-item-section>
          <q-item-section avatar>
            <q-btn
              @click="clearLogs"
              color="negative"
              icon="delete"
              padding="0.5rem"
              flat
            />
          </q-item-section>
        </q-item>

        <q-card-section v-if="LoggedPositions.length > 0">
          <q-item-label header style="padding: 0 0 0.5em">{{ $t('tracking.playLogs') }}</q-item-label>

          <div style="position: relative;">
            <q-slider
              @change="LogPlayer.Running.value ? LogPlayer.play() : null"
              v-model="Settings.PlayerProgress"
              @update:model-value="(value) => LogPlayer.setProgress(value)"
              :min="0"
              :max="1"
              :step="0"
            />
              <div style="position: absolute; top: 70%; left: 0;">
                {{ formatTimestamp(LogPlayer.getDuration() * Settings.PlayerProgress) }}
              </div>
              <div style="position: absolute; top: 70%; right: 0;">
                {{ formatTimestamp(LogPlayer.getDuration()) }}
              </div>
          </div>

          <div class="row no-wrap justify-center items-center q-gutter-sm">
              <q-btn
                @click="LogPlayer.Running.value ? LogPlayer.pause() : LogPlayer.play()"
                :icon="LogPlayer.Running.value ? 'pause' : 'play_arrow'"
                :color="LogPlayer.Running.value ? 'amber' : undefined"
                round
              />
              <q-btn
                @click="Settings.PlayerRepeats = !Settings.PlayerRepeats"
                :color="Settings.PlayerRepeats ? 'primary' : 'blue-grey-4'"
                icon="repeat"
                size="sm"
                round
              />
          </div>

        </q-card-section>
      </q-card>
    </q-dialog>
    <BusMap
      class="col"
      style="min-height: none; border-radius: 6px"
      :tracker="{id: trackerId, position: Position}"
      @map-loaded="mapLoaded"
    />
  </q-page>
</template>

<script setup>
import { useQuasar, Notify, LocalStorage, exportFile } from 'quasar'
import { ref, shallowRef, triggerRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

import { Capacitor, registerPlugin } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

import BusMap from 'src/components/BusMap.vue'
import apiRequest from 'src/components/apiRequest'

const $q = useQuasar()

let defaultSettings = {
  ShowLogPath: true,
  LoggingEnabled: false,
  PlayerProgress: 0,
  PlayerRepeats: false
}
const savedSettings = LocalStorage.getItem('TrackerSettings')
if (savedSettings && savedSettings.length === defaultSettings.length) {
  defaultSettings = savedSettings
}

const Settings = ref(defaultSettings)
watch(Settings.value, () => { LocalStorage.setItem('TrackerSettings', Settings.value) })

const SettingsVisible = ref(false)

const LogFile = ref(null)
const LoggedPositions = shallowRef(LocalStorage.getItem('LoggedPositions') || [])

const Position = ref(null)
const LoadingPosition = ref(false)
const watchId = ref(null)
const trackerId = ref(crypto.randomUUID())

function mapLoaded (map) {
  watch(() => Settings.value.ShowLogPath, () => {
    const value = Settings.value.ShowLogPath ? 'visible' : 'none'
    map.value.setLayoutProperty('TrackingPath', 'visibility', value)
    map.value.setLayoutProperty('TrackingPoints', 'visibility', value)
  })

  watch(LoggedPositions, () => {
    const geoJSONData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: LoggedPositions.value.map(({ latitude, longitude }) => [longitude, latitude])
      }
    }

    const lineSource = map.value.getSource('TrackingLog')
    if (lineSource) {
      lineSource.setData(geoJSONData)
    } else {
      map.value
        .addSource('TrackingLog', {
          type: 'geojson',
          data: geoJSONData
        })
        .addLayer({
          id: 'TrackingPath',
          source: 'TrackingLog',
          type: 'line',
          layout: { visibility: 'visible' },
          paint: {
            'line-color': 'limegreen',
            'line-width': 6,
            'line-dasharray': [2, 0.6]
          }
        })
        .addLayer({
          id: 'TrackingPoints',
          source: 'TrackingLog',
          type: 'circle',
          layout: { visibility: 'visible' },
          paint: {
            'circle-color': 'black',
            'circle-radius': 3,
            'circle-opacity': 0.5
          }
        })
    }
  }, { immediate: true })
}

// Logging implementation

function logPosition (position) {
  LoggedPositions.value.push(position)
  triggerRef(LoggedPositions)

  LocalStorage.setItem('LoggedPositions', LoggedPositions.value)
}

function clearLogs () {
  LogFile.value = null
  LoggedPositions.value = []

  LocalStorage.removeItem('LoggedPositions')
}

function formatTimestamp (timestamp) {
  const seconds = Math.floor(timestamp / 1000)
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

async function getNumberedName (fileName) {
  const files = (await Filesystem.readdir({
    path: '',
    directory: Directory.Documents
  })).files
  if (!files) { return fileName }

  const name = fileName.slice(0, fileName.lastIndexOf('.'))
  const ext = fileName.slice(fileName.lastIndexOf('.'))
  let iters = 1
  let numberedName = fileName

  while (true) {
    if (!files.some(item => item.name === numberedName)) { return numberedName }
    iters++
    numberedName = `${name}_${iters}${ext}`
  }
}

async function saveLogsToFile () {
  const fileName = 'GPS_Logs.json'
  const data = JSON.stringify(LoggedPositions.value, null, '\t')

  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.requestPermissions()
      const numberedName = await getNumberedName(fileName)
      Filesystem.writeFile({
        path: numberedName,
        data,
        encoding: Encoding.UTF8,
        directory: Directory.Documents
      }).then((file) => {
        Notify.create({
          type: 'positive',
          message: t('tracking.savedLogs', { fileName: numberedName }),
          caption: file.uri
        })
      })
    } catch (err) {
      Notify.create({ type: 'error', message: err.message })
    }
  } else {
    exportFile(fileName, data)
  }
}

function importLogFile () {
  const file = LogFile.value

  if (file.type !== 'application/json') {
    console.error('Invalid file type. Please provide a JSON file.')
    return
  }

  const reader = new FileReader()

  reader.onload = (event) => {
    try {
      const jsonObject = JSON.parse(event.target.result)
      LoggedPositions.value = jsonObject

      LocalStorage.setItem('LoggedPositions', jsonObject)
    } catch (error) {
      console.error('Error parsing JSON: ' + error.message)
    }
  }
  reader.onerror = () => { console.error('Error reading file.') }

  reader.readAsText(file)
}

function confirmLogImport () {
  if (LoggedPositions.value.length > 0) {
    $q.dialog({
      title: t('tracking.replaceLogs.title'),
      message: t('tracking.replaceLogs.message'),
      html: true,
      ok: { color: 'negative', label: t('tracking.replaceLogs.confirm'), 'no-caps': true },
      cancel: true,
      persistent: true
    }).onCancel(() => {
      LogFile.value = null
    }).onOk(() => {
      importLogFile()
    })
  } else {
    importLogFile()
  }
}

const LogPlayer = {
  Running: ref(false),
  currentTimeout: null,
  progressInterval: null,
  getDuration: function getDuration () {
    return (LoggedPositions.value.at(-1).time - LoggedPositions.value[0].time)
  },
  setProgress: function setProgress (newProgress) {
    Settings.value.PlayerProgress = Math.max(0, Math.min(1, newProgress))
    this.clear()
  },
  play: function play () {
    if (watchId.value) stopTracking()

    this.Running.value = true
    let startTime = Date.now() - (Settings.value.PlayerProgress * this.getDuration())
    let currentIndex = 0

    this.clear()
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      Settings.value.PlayerProgress = Math.min(elapsed / this.getDuration(), 1)
    }, 1000)

    const scheduleNext = () => {
      if (!this.Running) return
      if (currentIndex >= LoggedPositions.value.length) {
        if (!Settings.value.PlayerRepeats) {
          this.pause()
          return
        }
        currentIndex = 0
        startTime = Date.now()
      }

      const event = LoggedPositions.value[currentIndex]
      const eventTime = LoggedPositions.value[currentIndex].time - LoggedPositions.value[0].time
      const timeUntilEvent = eventTime - (Date.now() - startTime)

      if (timeUntilEvent <= 0) {
        if (timeUntilEvent >= -1500) updatePos(event)
        currentIndex++
        scheduleNext()
      } else {
        this.currentTimeout = setTimeout(() => {
          updatePos(event)
          currentIndex++
          scheduleNext()
        }, timeUntilEvent)
      }
    }
    scheduleNext()
  },
  pause: function pause () {
    this.clear()
    Position.value = null
    this.Running.value = false
  },
  clear: function clear () {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout)
      this.currentTimeout = null
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }
}

// Tracking functions

function updatePos (newPos) {
  LoadingPosition.value = false
  Position.value = newPos

  apiRequest('/trackers', {
    data: { id: trackerId.value, position: newPos },
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!Settings.value.LoggingEnabled || LogPlayer.Running.value) return
  logPosition(newPos)
}

let Geolocation
let BackgroundGPS
if (Capacitor.isNativePlatform()) {
  BackgroundGPS = registerPlugin('BackgroundGeolocation')
  import('@capacitor/geolocation').then((Module) => {
    Geolocation = Module.Geolocation
  })
} else {
  Geolocation = navigator.geolocation
}

const ErrorCodes = ['PERMISSION_DENIED', 'POSITION_UNAVAILABLE', 'TIMEOUT']
async function beginTracking () {
  if (LogPlayer.Running.value) { LogPlayer.pause() }
  LoadingPosition.value = true

  if (Capacitor.isNativePlatform()) {
    BackgroundGPS.addWatcher({
      backgroundTitle: t('tracking.notificationTitle'),
      backgroundMessage: t('tracking.notificationMessage'),
      requestPermissions: true
    }, (position, error) => {
      if (error) {
        return Notify.create({ type: 'error', caption: error.code })
      }
      updatePos({
        time: position.time,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        speed: position.speed,
        accuracy: position.accuracy
      })
    }).then((id) => {
      watchId.value = id
    })
    return
  }

  if (Geolocation && watchId.value == null) {
    watchId.value = await Geolocation.watchPosition(
      (position) => {
        const coords = position.coords
        updatePos({
          time: position.timestamp,
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude,
          speed: coords.speed,
          accuracy: coords.accuracy
        })
      },
      (error) => {
        Notify.create({ type: 'error', message: error.message, caption: ErrorCodes[error.code + 1] })
      },
      { enableHighAccuracy: true }
    )
  }
}

function stopTracking () {
  LoadingPosition.value = false
  Position.value = null

  apiRequest('/trackers', {
    data: { id: trackerId.value, action: 'stop' },
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  if (watchId.value) {
    if (Capacitor.isNativePlatform()) {
      BackgroundGPS.removeWatcher({ id: watchId.value })
    } else {
      Geolocation.clearWatch(watchId.value)
    }
    watchId.value = null
  }
}
</script>
