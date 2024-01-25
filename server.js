const path = require('path')
const serveStatic = require('serve-static')
const history = require('connect-history-api-fallback')
const backend = require('./server/backend.js')

const port = process.env.PORT || 3000
const { app, httpServer } = backend.setup()

app.use(history())
app.use(serveStatic(path.join(__dirname, 'dist', 'spa')))
httpServer.listen(port, () => {
  console.log('Server connected to ' + port)
})
