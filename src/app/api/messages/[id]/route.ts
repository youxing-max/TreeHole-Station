import { NextResponse } from 'next/server';
import { getMessages, saveMessages } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) {
      return unauthorized;
    }

    const data = await getMessages();
    const index = data.messages.findIndex(m => m.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }
    data.messages.splice(index, 1);
    await saveMessages(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) {
      return unauthorized;
    }

    const body = await request.json();
    const data = await getMessages();
    const index = data.messages.findIndex(m => m.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }
    if (body.isPinned !== undefined) {
      data.messages[index].isPinned = body.isPinned;
    }
    await saveMessages(data);
    return NextResponse.json({ message: data.messages[index] });
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
