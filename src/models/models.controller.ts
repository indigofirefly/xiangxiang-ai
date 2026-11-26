import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ModelsService } from './models.service.js';
@Controller('models')
export class ModelsController {
    constructor(private readonly modelsService: ModelsService) {}

    @Post('base-chat')
    async baseChat(@Body() body: { message: string }) {
        return this.modelsService.baseChat(body.message);
    }

    @Post('chat-with-system')
    async chatWithSystem(@Body() body: { system: string, message: string }) {
        return this.modelsService.chatWithSystem(body.system, body.message);
    }

    @Post('stream-chat')
    async streamChat(@Body() body: { message: string}, @Res() res: Response) {
        return this.modelsService.streamChat(body.message, res);
    }

    @Post('chat-with-parse')
    async chatWithParse(@Body() body: { message: string }) {
        return this.modelsService.chatWithParse(body.message);
    }
}
