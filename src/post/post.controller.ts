import { Controller, Get, Post, Body } from '@nestjs/common';
import { PostService } from './post.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';

@Controller('post')
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Get("getPostList")
    async getPosts() {
        return this.postService.getPosts();
    }
    @Post('create')
    async createPost(@Body() createPostDto: CreatePostDto) {
        return this.postService.createPost(createPostDto);
    }
}
