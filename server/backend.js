function expectJSON (req, res, next) {
  for(const i in req.body) return next()
  res.status(400).json({message: 'No JSON body was provided.'})
}

function errBadJSON(res, propertyName, info) {
  const msg = 'JSON property of `' + propertyName + '` does not exist.'

  if (info !== undefined) {
    msg += ' ' + info
  }
  res.status(400).json( { message: msg } )
}

function apiRoute () {
  const express = require('express')
  const router = express.Router()

  function setModelRoutes (path, dataModel) {
    router.route(path)
    .get(async (req, res, next) => {
      dataModel.find().then((results) => {
        res.status(200).json(results)
      }).catch(next)
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
    .patch((req, res) => {

    })
    .delete(expectJSON, async (req, res, next) => {
      if (!(req.body.id instanceof Array)) {
        console.log(typeof req.query.id)
        errBadJSON(res, 'id', 'Make sure to submit `id` as an array.')
        return
      }

      dataModel.deleteMany( { _id: { $in: req.body.id } } ).then(() => {
        res.status(200).end()
      }).catch(next)
    })
  }

  const mongoose = require('mongoose')
  mongoose.connect('mongodb://localhost:27017/BusRouteData')

  router.use(express.json())

  setModelRoutes('/stops', require('./models/Stop'))
  setModelRoutes('/routes', require('./models/Route'))

  return router
}

function setup () {
  const express = require('express')
  const { createServer } = require('node:http')

  const app = express()
  app.disable('x-powered-by') //hide express
  app.use('/api', apiRoute())

  const httpServer = createServer(app)

  if (false) {
    const { Server } = require('socket.io')
    const io = new Server(httpServer)
  }

  return { app, httpServer }
}

module.exports = { apiRoute, setup }
