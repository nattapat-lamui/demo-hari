import { Router } from 'express';
import AnnouncementsController from '../controllers/AnnouncementsController';
import { apiLimiter } from '../middlewares/security';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/announcements - Get all announcements
router.get('/', AnnouncementsController.getAllAnnouncements.bind(AnnouncementsController));

// POST /api/announcements - Create new announcement
router.post('/', apiLimiter, AnnouncementsController.createAnnouncement.bind(AnnouncementsController));

// PATCH /api/announcements/:id - Update announcement (Admin only)
router.patch('/:id', requireAdmin, apiLimiter, AnnouncementsController.updateAnnouncement.bind(AnnouncementsController));

// DELETE /api/announcements/:id - Delete announcement (Admin only)
router.delete('/:id', requireAdmin, apiLimiter, AnnouncementsController.deleteAnnouncement.bind(AnnouncementsController));

export default router;
