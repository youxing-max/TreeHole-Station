import { NextResponse } from 'next/server';
import { getMessages, saveMessages } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) {
      return unauthorized;
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '回复内容不能为空' }, { status: 400 });
    }

    const data = await getMessages();
    const index = data.messages.findIndex(m => m.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }

    data.messages[index].reply = content.trim();
    await saveMessages(data);

    return NextResponse.json({ message: data.messages[index] });
  } catch {
    return NextResponse.json({ error: '回复失败' }, { status: 500 });
  }
}
