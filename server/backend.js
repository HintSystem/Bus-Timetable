import mongoose from 'mongoose'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

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
  const router = express.Router()

  function setModelRoutes (path, dataModel) {
    router.route(path)
    .get(async (req, res, next) => {
      dataModel.find().lean().then((results) => {
        res.status(200).json(results)
      }).catch(next)
    })
    .patch(expectJSON, async (req, res, next) => {
      if (!('objects' in req.body)) {
        errBadJSON(res, 'objects', 'Key must be the id and the value must contain the changed properties.')
        return
      }

      for (const key in req.body.objects) {
        const doc = await dataModel.findById(key)
        doc.set(req.body.objects[key])
        await doc.save().catch((err) => {
          throw err
        })
      }
      res.status(200).end()
    })
    .post(expectJSON, async (req, res, next) => {
      if (!('objects' in req.body)) {
        errBadJSON(res, 'objects')
        return
      }

      dataModel.insertMany(req.body.objects).then(() => {
        res.status(200).end()
      }).catch(next)
    })
    .delete(expectJSON, async (req, res, next) => {
      if (!(req.body.id instanceof Array)) {
        errBadJSON(res, 'id', 'Make sure to submit `id` as an array.')
        return
      }

      dataModel.deleteMany( { _id: { $in: req.body.id } } ).then(() => {
        res.status(200).end()
      }).catch(next)
    })
  }

  mongoose.connect('mongodb://127.0.0.1:27017/BusRouteData')
    .catch((err) => {
      console.warn(err)
    })

  router.use(express.json())

  setModelRoutes('/stops', require('./models/Stop'))
  setModelRoutes('/routes', require('./models/Route'))

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
