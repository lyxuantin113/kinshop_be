import { Router } from 'express';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';
import { SystemConfigRepository } from './system-config.repository';
import { protect, authorize } from '../../common/middleware/auth.middleware';

const router = Router();
const repository = new SystemConfigRepository();
const service = new SystemConfigService(repository);
const controller = new SystemConfigController(service);

router.get('/', controller.getAllConfigs);

router.use(protect, authorize('ADMIN'));

router.patch('/:key', controller.updateConfig);

export default router;
