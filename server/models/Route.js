import mongoose from 'mongoose'

const RouteSchema = new mongoose.Schema({
  name: String,
  inbound: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stop' }],
  outbound: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stop' }]
})

export default mongoose.model('Route', RouteSchema, 'Routes')
