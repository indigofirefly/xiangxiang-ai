import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
@Injectable()
export class PostService {
    constructor(private readonly prisma: PrismaService) {}
    async getPosts() {
        return this.prisma.post.findMany();
    }
    async createPost(createPostDto: CreatePostDto) {
        const post = await this.prisma.post.create({
            data: {
                title: createPostDto.title,
                content: createPostDto.content,
                published: createPostDto.published,
                authorId: createPostDto.authorId,
            }
        });
        return {
            message: "create post success",
            data: post
        };
    }
}
