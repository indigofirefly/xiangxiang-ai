import { Controller, Post, Body, Res, Query, Get } from '@nestjs/common';
import type { Response } from 'express';
import { MemoryService } from './memory.service.js';

@Controller('memory')
export class MemoryController {
    constructor(private readonly memoryService: MemoryService) {}

    @Post('chat')
    async chat(@Body() body: { sessionId: string, message: string }) {
        return this.memoryService.chat(body.sessionId, body.message);
    }
    
    @Post('chat-stream')
    async chatStream(
        @Body() body: { sessionId: string, message: string },
        @Res() res: Response,
    ) {
        return this.memoryService.chatStream(body.sessionId, body.message, res);
    }

    @Get('get-history')
    async getHistory(@Query('sessionId') sessionId: string) {
        return this.memoryService.getHistory(sessionId);
    }

    @Post('clear-session')
    async clearSession() {
        return this.memoryService.clearSession();
    }

    @Get('list-sessions')
    async listSessions() {
        return this.memoryService.listSessions();
    }
    
    @Post('delete-session')
    async deleteSession(@Body() body: { sessionId: string }) {
        return this.memoryService.deleteSession(body.sessionId);
    }
}
