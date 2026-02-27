import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';  
import dbConnect from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';  

dotenv.config();

const app = express();

// Middleware globales
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.send('Bienvenido a la API de Películas');
});

// Archivos estáticos
app.use('/uploads', express.static('storage'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Rutas de la API
app.use('/api', routes);

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await dbConnect();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
  });
};

startServer();  // Iniciar el servidor