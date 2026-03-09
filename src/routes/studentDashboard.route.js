import express from 'express';
import { studentDashboard } from '../controllers/studentDashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const studentDashboardRouter = express.Router();

studentDashboardRouter.get(
  '/:slug/me/dashboard',
  authenticate,
  authorize('STUDENT'),
  studentDashboard
);

export default studentDashboardRouter;
