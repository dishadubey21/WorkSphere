import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment
} from '../controllers/task.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getTasks)
  .post(authorize('Admin', 'Manager', 'Team Lead'), createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(authorize('Admin', 'Manager'), deleteTask);

router.route('/:id/comments')
  .post(addTaskComment);

export default router;
