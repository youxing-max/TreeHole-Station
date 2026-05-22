import { NextResponse } from 'next/server';
import { getPosts, savePosts } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { Post } from '@/types';

export async function GET() {
  try {
    const data = await getPosts();
    const sortedPosts = data.posts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ posts: sortedPosts });
  } catch {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) {
      return unauthorized;
    }

    const body = await request.json();
    const { title, content, summary, tags = [], coverImage } = body;

    if (!title || !content || title.trim().length === 0 || content.trim().length === 0) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
    }

    const data = await getPosts();
    const now = new Date().toISOString();

    const newPost: Post = {
      id: String(Date.now()),
      title: title.trim(),
      content: content.trim(),
      summary: summary?.trim() || content.slice(0, 200) + '...',
      tags: tags.filter((t: string) => t.trim()),
      coverImage,
      createdAt: now,
      updatedAt: now,
      views: 0,
      likeCount: 0,
      favoriteCount: 0,
      likedBy: {},
      favoritedBy: {},
      comments: [],
    };

    data.posts.unshift(newPost);
    data.lastId = parseInt(newPost.id);
    await savePosts(data);

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
