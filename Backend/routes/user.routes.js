// backend/routes/user.routes.js
import { Router } from 'express';
const router = Router();
import { getProfile, updateProfile, changePassword, updatePreferences, getUserActivity, getUserStats, deactivateAccount } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.js';

// All routes require authentication
router.use(protect);

// Profile management
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Password management
router.put('/change-password', changePassword);

// Preferences
router.put('/preferences', updatePreferences);

// User activity and stats
router.get('/activity', getUserActivity);
router.get('/stats', getUserStats);

// Account management
router.delete('/account', deactivateAccount);

export default router;