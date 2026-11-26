import { Controller, Post, Body } from '@nestjs/common';
import { ChainsService } from './chains.service.js';
@Controller('chains')
export class ChainsController {
    constructor(private readonly chainsService: ChainsService) {}

    // 润色文章
    @Post('polish-article')
    async polishArticle(@Body() body: { article: string }) {
        return this.chainsService.polishArticle(body.article);
    }

    // 生成小说
    @Post('generate-novel')
    async generateNovel(@Body() body: { keywords: string, style: string }) {
        return this.chainsService.generateNovel(body.keywords, body.style);
    }

    // 智能客服路由
    @Post('smart-router')
    async smartRouter(@Body() body: { question: string }) {
        return this.chainsService.smartRouter(body.question);
    }
}
