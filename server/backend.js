module.exports = function (httpServer, app) {
  if (app !== undefined) {
    const express = require('express')
    const router = express.Router()

    const mongoose = require('mongoose')
    mongoose.connect('mongodb://localhost:27017/BusRouteData')

    const Stop = require('./models/Stop')
    const Route = require('./models/Route')

    router.get('/stops', async (req, res) => {
      try {
        const stops = await Stop.find()
        res.json(stops)
      } catch (err) {
        res.status(500).json({ message: err.message })
      }
    })

    router.get('/routes', async (req, res) => {
      try {
        const stops = await Route.find()
        res.json(stops)
      } catch (err) {
        res.status(500).json({ message: err.message })
      }
    })

    app.use('/api', router)
    app.disable('x-powered-by') // hide express
  }

  if (false) {
    const { Server } = require('socket.io')
    const io = new Server(httpServer)
  }
}
