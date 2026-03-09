import { Request, Response } from 'express';
import { SystemConfigService, ConfigKey } from './system-config.service';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AppError } from '../../common/errors/app-error';

export class SystemConfigController {
    constructor(private readonly configService: SystemConfigService) { }

    getAllConfigs = asyncHandler(async (req: Request, res: Response) => {
        const configs = await this.configService.getAllConfigs();
        res.status(200).json({
            status: 'success',
            data: configs
        });
    });

    updateConfig = asyncHandler(async (req: Request, res: Response) => {
        const { key } = req.params;
        const { value, description } = req.body;

        if (!value) throw new AppError('Value is required', 400);

        await this.configService.setConfig(key as ConfigKey, value, description);

        res.status(200).json({
            status: 'success',
            message: `Config ${key} updated successfully`
        });
    });
}
