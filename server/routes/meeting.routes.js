import express from 'express';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from '../controllers/meeting.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMeetings)
  .post(createMeeting);

router.route('/:id')
  .put(updateMeeting)
  .delete(deleteMeeting);

export default router;
