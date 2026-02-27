// src/controllers/storage.controller.js
import Storage from '../models/movieModel.js';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import Movie from '../models/movieModel.js';

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3000';

/*

Método      Ruta        Descripción

GET     /api/movies         Listar películas (filtro: ?genre=comedy)

GET     /api/movies/:id      Obtener película por ID

POST    /api/moviesCrear    nueva película

PUT     /api/movies/:id     Actualizar película

DELETE  /api/movies/:id          Eliminar película

POST    /api/movies/:id/rent     Alquilar película

POST    /api/movies/:id/return   Devolver película

PATCH   /api/movies/:id/cover    Subir/reemplazar carátula (multipart)

GET     /api/movies/:id/cover   Obtener imagen de carátula

GET     /api/movies/stats/top   Top 5 más alquiladas
*/


export const createMovie = async (req, res) => {
  try {
    const { title, director, year, genre, copies, availableCopies, cover } = req.body;

    const newMovie = new Movie({title,director,year,genre,copies,availableCopies,cover});
    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find();
    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Película no encontrada' });
    }
    res.status(200).json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMovie) {
      return res.status(404).json({ message: 'Película no encontrada' });
    }
    res.status(200).json(updatedMovie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    if (!deletedMovie) {
      return res.status(404).json({ message: 'Película no encontrada' });
    }
    res.status(200).json({ message: 'Película eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};