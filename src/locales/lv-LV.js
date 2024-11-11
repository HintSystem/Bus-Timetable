export default {
  appName: 'Autobusu Saraksts',
  settings: 'Iestatījumi',
  debug: 'Atkļūdošana',

  tracking: {
    title: 'Autobusa Izsekotājs',
    start: 'Sākt izsekošanu',
    stop: 'Beigt izsekošanu',

    showLogPath: 'Rādīt lokācijas ieraksta ceļu',
    enableLogging: 'Ieslēgt lokācijas ierakstīšanu',
    importLogs: 'Importēt lokācijas ierakstus no JSON faila',
    saveLogs: 'Saglabāt lokācijas ierakstus JSON failā',
    clearLogs: 'Iztīrīt lokācijas ierakstus',
    playLogs: 'Atskaņot lokāciju no ieraksta',
    replaceLogs: {
      title: 'Aizstāt ierakstu ar failu?',
      message: "Tulīt tiks <span class='text-negative'><strong>neatgriezeniski izdzēsti</strong></span> un aizvietot visi esošie ieraksti ar jauni importētajiem failiem.",
      confirm: 'Izdzēst ierakstus'
    },

    copyCoords: 'Koordinātas nokopētas!',
    savedLogs: 'Ieraksti saglabāti failā - {fileName}',

    notificationTitle: 'Autobuss tiek izsekots',
    notificationMessage: 'Aizver aplikāciju lai izslēgtu'
  }
}
