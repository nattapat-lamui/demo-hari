import { Router } from 'express';
import EventsController from '../controllers/EventsController';
import { apiLimiter } from '../middlewares/security';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/events - Get all events
router.get('/', EventsController.getAllEvents.bind(EventsController));

// GET /api/events/upcoming - Get upcoming events
router.get('/upcoming', EventsController.getUpcomingEvents.bind(EventsController));

// POST /api/events/upcoming - Create new upcoming event
router.post('/upcoming', apiLimiter, EventsController.createUpcomingEvent.bind(EventsController));

// DELETE /api/events/upcoming/:id - Delete an upcoming event
router.delete('/upcoming/:id', apiLimiter, EventsController.deleteUpcomingEvent.bind(EventsController));

export default router;
