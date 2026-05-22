import { NextResponse } from 'next/server';
import { getMessages, saveMessages } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { getOrCreateVisitor } from '@/lib/visitors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getMessages();
    const message = data.messages.find(m => m.id === params.id);
    if (!message) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }

    return NextResponse.json({ comments: message.comments || [] });
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

    const data = await getMessages();
    const message = data.messages.find(m => m.id === params.id);
    if (!message) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }

    if (!message.comments) {
      message.comments = [];
    }

    const comment = {
      id: String(Date.now()),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      visitorName,
      isAdmin: isAdmin ? true : undefined,
    };

    message.comments.push(comment);
    await saveMessages(data);

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '评论失败' }, { status: 500 });
  }
}
