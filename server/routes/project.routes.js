import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/project.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getProjects)
  .post(authorize('Admin'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('Admin'), updateProject)
  .delete(authorize('Admin'), deleteProject);

export default router;
