const mongoose = require('mongoose')

const RouteSchema = new mongoose.Schema({
  name: String,
  inbound: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stop' }],
  outbound: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stop' }]
})

module.exports = mongoose.model('Route', RouteSchema, 'Routes')
