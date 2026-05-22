import { NextResponse } from 'next/server';
import { getPosts, savePosts } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { getOrCreateVisitor } from '@/lib/visitors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getPosts();
    const post = data.posts.find(p => p.id === params.id);
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({ comments: post.comments || [] });
  } catch {
    return NextResponse.json({ error: '获取评论失败' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: '评论内容过长' }, { status: 400 });
    }

    const isAdminHeader = request.headers.get('x-from-admin');
    const isAdmin = isAdminHeader ? await isAdminAuthenticated() : false;

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    const visitor = await getOrCreateVisitor(ip, ua);
    const visitorName = visitor.name;

    const data = await getPosts();
    const post = data.posts.find(p => p.id === params.id);
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    if (!post.comments) {
      post.comments = [];
    }

    const comment = {
      id: String(Date.now()),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      visitorName,
      isAdmin: isAdmin ? true : undefined,
    };

    post.comments.push(comment);
    await savePosts(data);

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '评论失败' }, { status: 500 });
  }
}
