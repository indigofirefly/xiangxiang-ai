import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ModelsService } from './models.service.js';
@Controller('models')
export class ModelsController {
    constructor(private readonly modelsService: ModelsService) {}

    @Post('baseChat')
    async baseChat(@Body() body: { message: string }) {
        return this.modelsService.baseChat(body.message);
    }

    @Post('chatWithSystem')
    async chatWithSystem(@Body() body: { system: string, message: string }) {
        return this.modelsService.chatWithSystem(body.system, body.message);
    }

    @Post('streamChat')
    async streamChat(@Body() body: { message: string}, @Res() res: Response) {
        return this.modelsService.streamChat(body.message, res);
    }

    @Post('chatWithParse')
    async chatWithParse(@Body() body: { message: string }) {
        return this.modelsService.chatWithParse(body.message);
    }
}
