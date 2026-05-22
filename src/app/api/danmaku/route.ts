import { NextResponse } from 'next/server';
import { getDanmaku, saveDanmaku } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getOrCreateVisitor } from '@/lib/visitors';
import type { Danmaku } from '@/types';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#FF8C94', '#A8E6CF', '#FFD93D',
  '#6C5CE7', '#FD79A8', '#00CEC9', '#E17055', '#74B9FF',
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';

    if (adminView) {
      const unauthorized = await requireAdmin();
      if (unauthorized) {
        return unauthorized;
      }

      return NextResponse.json({ danmaku: [...(await getDanmaku()).danmaku].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ) });
    }

    const data = await getDanmaku();
    const recentDanmaku = data.danmaku
      .filter(d => Date.now() - new Date(d.createdAt).getTime() < 24 * 60 * 60 * 1000)
      .slice(-100);
    return NextResponse.json({ danmaku: recentDanmaku });
  } catch {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0 || content.length > 100) {
      return NextResponse.json({ error: '弹幕内容无效' }, { status: 400 });
    }

    const data = await getDanmaku();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    const visitor = await getOrCreateVisitor(ip, ua);

    const newDanmaku: Danmaku = {
      id: String(Date.now()),
      content: content.trim(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: 2 + Math.random() * 3,
      visitorName: visitor.name,
      createdAt: new Date().toISOString(),
    };

    data.danmaku.push(newDanmaku);
    data.lastId = parseInt(newDanmaku.id);
    await saveDanmaku(data);

    return NextResponse.json({ danmaku: newDanmaku }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}
