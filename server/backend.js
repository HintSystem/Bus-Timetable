function expectJSON (req, res, next) {
  for(const i in req.body) return next()
  res.status(400).json({message: 'No JSON body was provided.'})
}

function errBadJSON(res, propertyName, info) {
  const msg = 'JSON property of `' + propertyName + '` does not exist.'

  if (info !== undefined) msg += ' ' + info
  res.status(400).json( { message: msg } )
}

function apiRoute () {
  const express = require('express')
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

  const mongoose = require('mongoose')

  mongoose.connect('mongodb://127.0.0.1:27017/BusRouteData')
    .catch((err) => {
      console.warn(err)
    })

  router.use(express.json())

  setModelRoutes('/stops', require('./models/Stop'))
  setModelRoutes('/routes', require('./models/Route'))

  return router
}

function setup (app) {
  const express = require('express')
  const { createServer } = require('node:http')

  if (!app) { app = express() }
  const httpServer = createServer(app)

  if (true) {
    const { Server } = require('socket.io')
    const io = new Server(httpServer, {
      addTrailingSlash: false
    })

    const trackers = io.of('/track')

    trackers.on('connection', (socket) => {
      console.log('tracker connected', socket.id)

      socket.on('location', (msg) => {
        console.log(msg)
        io.emit('location', msg)
      })
    })
  }

  app.disable('x-powered-by')
  app.use('/api', apiRoute())

  return { app, httpServer }
}

module.exports = { apiRoute, setup }
