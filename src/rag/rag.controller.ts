import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { RagService } from './rag.service.js';

@Controller('rag')
export class RagController {

    constructor(private readonly ragService: RagService) {}

    @Post('load-documents')
    async loadDocuments(@Body() body: { documents: { id: string, content: string, source: string }[] }) {
        return this.ragService.loadDocuments(body.documents);
    }

    @Get('search')
    async search(@Query('query') query: string, @Query('topK') topK?: number) {
        return this.ragService.search(query, topK);
    }

    @Get('query')
    async query(@Query('question') question: string, @Query('topK') topK?: number) {
        return this.ragService.query(question, topK);
    }

    @Get('status')
    async status() {
        return this.ragService.getSatus();
    }

    @Post('clear')
    async clear() {
        return this.ragService.clear();
    }
}
