import multer from 'multer';
import { extname, join, dirname } from 'node:path';


const __dirname = dirname(new URL(import.meta.url).pathname);

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(__dirname, '../../storage');  
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = extname(file.originalname).toLowerCase();  
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);  
  }
});

// Filtro de tipos de archivo (solo imágenes)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);  // Aceptar el archivo
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);  
  }
};

// Middleware de upload con límites y validaciones
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 1  
  }
});

export default uploadMiddleware;