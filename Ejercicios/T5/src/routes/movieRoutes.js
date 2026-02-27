import express from 'express';
import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  getTopMovies
} from '../controllers/moviesControllers.js';

const router = express.Router();

// Rutas para películas
router.post('/', createMovie); // Crear pelicula
router.get('/', getMovies); // Obtener todas las peliculas
router.get('/:id', getMovieById); // Obtener pelicula por ID
router.put('/:id', updateMovie); // Actualizar pelicula por ID
router.delete('/:id', deleteMovie); // Eliminar pelicula por ID
router.get('/movies/stats/top', getTopMovies);// Obtener top peliculas 
//router.patch('/:id/cover', uploadMiddleware.single('cover'), uploadCover);

export default router;