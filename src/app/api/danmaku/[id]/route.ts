import { NextResponse } from 'next/server';
import { getDanmaku, saveDanmaku } from '@/lib/db';
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

    const data = await getDanmaku();
    const index = data.danmaku.findIndex(item => item.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: '弹幕不存在' }, { status: 404 });
    }

    data.danmaku.splice(index, 1);
    await saveDanmaku(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
