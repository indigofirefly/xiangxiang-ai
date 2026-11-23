import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './userModule/user.module.js';
import { PostModule } from './post/post.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ModelsModule } from './models/models.module.js';
import { PromptsModule } from './prompts/prompts.module.js';
import { ChainsModule } from './chains/chains.module.js';
import { AgentsModule } from './agents/agents.module.js';
import { MemoryModule } from './memory/memory.module.js';
import { RagModule } from './rag/rag.module.js';
import { FunctionCallingModule } from './function-calling/function-calling.module.js';
@Module({
  imports: [UserModule, PostModule, PrismaModule, ModelsModule, PromptsModule, ChainsModule, AgentsModule, MemoryModule, RagModule, FunctionCallingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
