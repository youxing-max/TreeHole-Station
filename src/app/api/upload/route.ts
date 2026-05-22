import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: Request) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '只支持图片' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '图片太大' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filepath, buffer);

    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
