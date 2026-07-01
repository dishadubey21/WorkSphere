import express from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcement.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getAnnouncements)
  .post(authorize('Admin', 'Manager'), createAnnouncement);

router.route('/:id')
  .get(getAnnouncementById)
  .put(authorize('Admin', 'Manager'), updateAnnouncement)
  .delete(authorize('Admin', 'Manager'), deleteAnnouncement);

export default router;
