import mongoose from 'mongoose'

const StopSchema = new mongoose.Schema({
  name: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  type: { type: String }
})

export default mongoose.model('Stop', StopSchema, 'Stops')
