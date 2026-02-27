import express from 'express';
import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie
} from '../controllers/moviesControllers.js';

const router = express.Router();

// Rutas para películas
router.post('/', createMovie); // Crear película
router.get('/', getMovies); // Obtener todas las películas
router.get('/:id', getMovieById); // Obtener película por ID
router.put('/:id', updateMovie); // Actualizar película por ID
router.delete('/:id', deleteMovie); // Eliminar película por ID

export default router;