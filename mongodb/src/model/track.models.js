// src/models/track.model.js
import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  // Referencia a User
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Array de referencias
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  genres: [String],
  plays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

const Track = mongoose.model('Track', trackSchema);
export default Track;