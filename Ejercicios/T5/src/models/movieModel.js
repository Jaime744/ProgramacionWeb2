import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength:2
  },
  director: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    min: 1888,
    max: new Date().getFullYear(),
    required:true
  },
  genre: {
    type: String,
    enum: ['action', 'comedy', 'drama', 'horror', 'scifi'],
    required:true
  },
  copies: {
    type: Number,
    default: 5,
    min:0,
  },
  Copies: {
    type: Number,
    default: 5,
    min:0,
  },
  timesRented: {
    type: Number,
    default: 0
  },
  cover: {
    type: String,
    default: null
  }
});

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;