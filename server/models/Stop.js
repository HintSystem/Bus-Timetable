const mongoose = require('mongoose')

const StopSchema = new mongoose.Schema({
  name: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  type: { type: String }
})

module.exports = mongoose.model('Stop', StopSchema, 'Stops')
