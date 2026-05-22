import { NextResponse } from 'next/server';
import { getMessages, saveMessages } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getOrCreateVisitor } from '@/lib/visitors';
import type { Message } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSecret = searchParams.get('includeSecret') === 'true';

    if (includeSecret) {
      const unauthorized = await requireAdmin();
      if (unauthorized) {
        return unauthorized;
      }
    }

    const data = await getMessages();
    const messages = includeSecret
      ? data.messages
      : data.messages.filter(m => m.type !== 'secret');

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: '获取留言失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, type = 'message', images = [] } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: '内容过长' }, { status: 400 });
    }

    const data = await getMessages();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    const visitor = await getOrCreateVisitor(ip, ua);

    const newMessage: Message = {
      id: String(Date.now()),
      type: type === 'secret' ? 'secret' : 'message',
      content: content.trim(),
      images: images.slice(0, 3),
      emojiReactions: {},
      likeCount: 0,
      favoriteCount: 0,
      likedBy: {},
      favoritedBy: {},
      comments: [],
      createdAt: new Date().toISOString(),
      visitorName: visitor.name,
      isPinned: false,
    };

    data.messages.unshift(newMessage);
    data.lastId = parseInt(newMessage.id);
    await saveMessages(data);

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '发布失败' }, { status: 500 });
  }
}
