export default {
  settings: 'Settings',
  debug: 'Debug',
  logging: 'Logging',
  tracking: {
    title: 'Bus Tracker',
    start: 'Start tracking',
    stop: 'Stop tracking',

    showLogPath: 'Show location log path',
    enableLogging: 'Enable location logging',
    importLogs: 'Import logs from JSON',
    saveLogs: 'Save logs to JSON',
    clearLogs: 'Clear location logs',
    playLogs: 'Play location from logs',
    replaceLogs: {
      title: 'Replace logs with file?',
      message: "You are about to <span class='text-negative'><strong>permanently delete</strong></span> and replace all existing logs with this newly imported file.",
      confirm: 'Delete Logs'
    },

    copyCoords: 'Copied coordinates!',
    savedLogs: 'Logs saved to - {fileName}',

    notificationTitle: 'Tracking bus',
    notificationMessage: 'Close the app to cancel'
  }
}
