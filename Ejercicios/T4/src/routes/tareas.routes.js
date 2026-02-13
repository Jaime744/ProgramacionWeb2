import { Router } from 'express';
import * as tareasController from '../controllers/tareas.controller.js';

const router = Router();

router.get('/', tareasController.getAll);
router.get('/:id', tareasController.getById);
router.post('/', tareasController.create);
router.put('/:id', tareasController.update);
router.patch('/:id', tareasController.partialUpdate);
router.delete('/:id', tareasController.remove);

export default router;