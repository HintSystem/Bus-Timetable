import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

import { importGtfs, openDb, closeDb, getStops, getRoutes } from 'gtfs'
import path from 'node:path'

function expectJSON (req, res, next) {
  for(const i in req.body) return next()
  res.status(400).json({message: 'No JSON body was provided.'})
}

function errBadJSON(res, propertyName, info) {
  let msg = 'JSON property of `' + propertyName + '` does not exist.'

  if (info !== undefined) msg += ' ' + info
  res.status(400).json( { message: msg } )
}

export function databaseRoutes () {
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

  const router = express.Router()
  router.use(express.json())

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

  const router = databaseRoutes()

  if (true) {
    const io = new Server(httpServer, {
      addTrailingSlash: false
    })

    router.route('/trackers').post(expectJSON, async (req, res, next) => {
      if (!('id' in req.body)) {
        errBadJSON(res, 'id')
        return
      }
      if (!('position' in req.body)) {
        errBadJSON(res, 'id')
        return
      }

      io.emit('location', req.body)
    })
  }

  app.disable('x-powered-by')
  app.use('/api', router)

  return { app, httpServer }
}
