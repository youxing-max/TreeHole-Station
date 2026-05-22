import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = path.basename(params.filename);
    const filepath = path.join(UPLOAD_DIR, filename);

    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    const buffer = await fs.readFile(filepath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: '图片不存在' }, { status: 404 });
  }
}
