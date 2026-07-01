import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployeePassword
} from '../controllers/employee.controller.js';
import { authorize, adminOrSelf, adminOrManagerOrSelf } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(authorize('Admin', 'Manager', 'Team Lead'), getEmployees)
  .post(authorize('Admin'), createEmployee);

router.route('/:id/reset-password')
  .post(authorize('Admin'), resetEmployeePassword);

router.route('/:id')
  .get(adminOrManagerOrSelf, getEmployeeById)
  .put(adminOrSelf, updateEmployee)
  .delete(authorize('Admin'), deleteEmployee);

export default router;
