import { Router } from 'express';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import movieRoutes from './movieRoutes.js';


const router = Router();

router.use('/movies', movieRoutes);
const __dirname = dirname(new URL(import.meta.url).pathname);


const routeFiles = readdirSync(__dirname).filter(
  (file) => file.endsWith('.routes.js')
);

// Función asincrónica para cargar las rutas
const loadRoutes = async () => {
  for (const file of routeFiles) {
    const routeName = file.replace('.routes.js', ''); 
    const routeModule = await import(join(__dirname, file));  
    router.use(`/${routeName}`, routeModule.default); 
    console.log(`📍 Ruta cargada: /api/${routeName}`);
  }
};

// Ejecutar la carga de las rutas
loadRoutes();

export default router;