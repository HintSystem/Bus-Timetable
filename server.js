const express = require('express')
const { createServer } = require('node:http')
const serveStatic = require('serve-static')
const history = require('connect-history-api-fallback')
const path = require('path')

const port = process.env.PORT || 3000
const app = express()
const httpServer = createServer(app)

require('./server/backend.js')(httpServer, app) // api

app.use(history())
app.use(serveStatic(path.join(__dirname, 'dist', 'spa')))
httpServer.listen(port, () => {
  console.log('Server connected to ' + port)
})
