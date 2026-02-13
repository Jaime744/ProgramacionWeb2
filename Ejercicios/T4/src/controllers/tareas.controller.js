import { tareas } from '../data/tareas.data.js';
import { ApiError } from '../middleware/error.middleware.js';

const toDo = tareas.toDo;

// GET /api/tareas/toDO
export const getAll = (req, res) => {
  let resultado = [...toDo];
  const { id, title, descripcion, completed, priority,createAt} = req.query;
  
  // Filtrar por nivel
  if (completed) {
    resultado = resultado.filter(completed=true|false);
  }
  
  // Ordenar
 if (priority) {
    resultado = resultado.filter(priority=low|medium|high);
  }
  
  res.json(resultado);
};

// GET /api/tarea/toDo/:id
export const getById = (req, res) => {
  const id = parseInt(req.params.id);
  const tarea = toDo.find(c => c.id === id);
  
  if (!tarea) {
    throw ApiError.notFound(`tarea con ID ${id} no encontrado`);
  }
  
  res.json(tarea);
};

// POST /api/tareas/toDo
export const create = (req, res) => {
  const { title, descripcion, completed, priority,createAt } = req.body;
  
  const nuevoTarea = {
    id: toDo.length + 1,
    title,
    descripcion,
    completed: descripcion || null,
    priority,
    createAt
  };
  
  toDo.push(nuevoTarea);
  
  res.status(201).json(nuevoTarea);
};

// PUT /api/tareas/toDo:id
export const update = (req, res) => {
  const id = parseInt(req.params.id);
  const index = toDo.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw ApiError.notFound(`Tarea con ID ${id} no encontrado`);
  }
  
  const { title, descripcion, completed, priority,createAt } = req.body;
  
    toDo[index] = {
    id,
    title,
    descripcion: descripcion || null,
    completed,
    priority,
    createAt
  };
  
  res.json(toDo[index]);
};

// PATCH /api/cursos/programacion/:id
export const partialUpdate = (req, res) => {
  const id = parseInt(req.params.id);
  const index = toDo.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw ApiError.notFound(`Tarea con ID ${id} no encontrado`);
  }
  
  toDo[index] = {
    ...toDo[index],
    ...req.body
  };
  
  res.json(toDo[index]);
};

// DELETE /api/cursos/programacion/:id
export const remove = (req, res) => {
  const id = parseInt(req.params.id);
  const index = toDo.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw ApiError.notFound(`Tarea con ID ${id} no encontrado`);
  }
  
  toDo.splice(index, 1);
  
  res.status(204).end();
};