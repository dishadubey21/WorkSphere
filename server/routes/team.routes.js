import express from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
} from '../controllers/team.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getTeams)
  .post(authorize('Admin'), createTeam);

router.route('/:id')
  .get(getTeamById)
  .put(authorize('Admin'), updateTeam)
  .delete(authorize('Admin'), deleteTeam);

router.route('/:id/members')
  .post(authorize('Admin'), addTeamMember);

router.route('/:id/members/:employeeId')
  .delete(authorize('Admin'), removeTeamMember);

export default router;
