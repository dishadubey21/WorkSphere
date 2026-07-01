import express from 'express';
import { getSettings, updateSettings, getPersonalSettings, updatePersonalSettings } from '../controllers/settings.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Only Admin can view or update the organization settings
router.route('/org')
  .get(authorize('Admin'), getSettings)
  .put(authorize('Admin'), updateSettings);

// All logged in users can access personal settings
router.route('/personal')
  .get(getPersonalSettings)
  .put(updatePersonalSettings);

export default router;
