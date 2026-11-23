import { Controller, Post, Body } from '@nestjs/common';
import { PromptsService } from './prompts.service.js';

@Controller('prompts')
export class PromptsController {

    constructor(private readonly promptsService: PromptsService) {}

    @Post('translate-text')
    async translateText(@Body() body: { text: string, targetLanguage: string }) {
        return this.promptsService.translateText(body.text, body.targetLanguage);
    }

    @Post('summarize-text')
    async summarizeText(@Body() body: { text: string, maxWords: number }) {
        return this.promptsService.summarizeText(body.text, body.maxWords);
    }

    @Post('classify-text')
    async classifyText(@Body() body: { text: string }) {
        return this.promptsService.classifyText(body.text);
    }

    @Post('code-review')
    async codeReview(@Body() body: { code: string, language: string }) {
        return this.promptsService.codeReview(body.code, body.language);
    }

}
