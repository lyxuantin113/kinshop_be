import { Router } from 'express';
import { protect, authorize } from '../../common/middleware/auth.middleware';
import { container } from '../../common/container';

const router = Router();
const controller = container.systemConfigController;

router.get('/', controller.getAllConfigs);

router.use(protect, authorize('ADMIN'));

router.patch('/:key', controller.updateConfig);

export default router;
