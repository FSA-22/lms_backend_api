import { Router } from 'express';
import {
  getPlatformOverview,
  listTenants,
  getTenantDetails,
  createTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  getPlatformUsers,
  updateTenantSubscription
} from '../controllers/superUser.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const superuserRouter = Router();

superuserRouter.get('/:slug/overview', authenticate, authorize('SUPERUSER'), getPlatformOverview);

superuserRouter.get('/:slug/tenants', authenticate, authorize('SUPERUSER'), listTenants);
superuserRouter.get(
  '/:slug/tenants/:tenantId',
  authenticate,
  authorize('SUPERUSER'),
  getTenantDetails
);

superuserRouter.post('/:slug/tenants', authenticate, authorize('SUPERUSER'), createTenant);

superuserRouter.patch(
  '/:slug/tenants/:tenantId/suspend',
  authenticate,
  authorize('SUPERUSER'),
  suspendTenant
);
superuserRouter.patch(
  '/:slug/tenants/:tenantId/activate',
  authenticate,
  authorize('SUPERUSER'),
  activateTenant
);

superuserRouter.delete(
  '/:slug/tenants/:tenantId',
  authenticate,
  authorize('SUPERUSER'),
  deleteTenant
);

superuserRouter.get('/:slug/users', authenticate, authorize('SUPERUSER'), getPlatformUsers);

superuserRouter.patch(
  '/:slug/tenants/:tenantId/subscription',
  authenticate,
  authorize('SUPERUSER'),
  updateTenantSubscription
);

export default superuserRouter;
