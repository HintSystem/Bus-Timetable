import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

import { importGtfs, openDb, closeDb, getStops, getRoutes } from 'gtfs'
import path from 'node:path'

function expectJSON (req, res, next) {
  for(const i in req.body) return next()
  res.status(400).json({ message: 'No JSON body was provided.' })
}

function badJSON (propertyName) {
  return function(req, res, next) {
    if (propertyName in req.body) { return next() }

    res.status(400).json({ message: `JSON property of '${propertyName}' must be present in request.` })
  }
}

export function databaseRoutes (router) {
  importGtfs({
    agencies: [{ path: path.join(import.meta.dirname, './public/gtfs/latest.zip') }]
  })

  openDb()
  const events = ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM']
  events.forEach((eventType) => {
    process.on(eventType, async () => {
      console.log('Closing GTFS database ...')
      closeDb()
      process.exit()
    })
  })

  router.route('/stops').get((req, res, next) => {
    res.status(200).json(getStops())
  })
  router.route('/routes').get((req, res, next) => {
    res.status(200).json(getRoutes())
  })

  return router
}


export function setup (app) {
  if (!app) { app = express() }
  const httpServer = createServer(app)

  const router = express.Router()
  router.use(express.json())
  router.route('/status').get((req, res) => res.sendStatus(200))
  //databaseRoutes(router)

  router.get('/gtfs/:file', (req, res, next) => {
    let fileName = req.params.file
    if (path.extname(fileName) === '') { fileName += '.txt' }

    res.sendFile(fileName, { root: path.join(__dirname, '../public/gtfs/') }, (err) => {
      if (err) {
        console.log('Error sending file:', err)
        res.sendStatus(err.status)
      }
    })
  })

  if (true) {
    const io = new Server(httpServer, {
      addTrailingSlash: false
    })

    router.route('/trackers').post(expectJSON,
      badJSON('id'),
      (req, res, next) => {
        if (typeof req.body.action !== 'string') return next()
        const action = req.body.action.toLowerCase()

        if (action === 'stop') {
          io.emit('tracker_disconnect', req.body.id)
          return res.sendStatus(200)
        }
        next()
      },
      badJSON('position'),
      (req, res, next) => {
        console.log(`pos received ${req.body.id}`)
        io.emit('location', req.body)
        res.sendStatus(200)
    })
  }

  app.disable('x-powered-by')
  app.use('/api', router)

  return { app, httpServer }
}
