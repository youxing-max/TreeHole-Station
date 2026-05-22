import { NextResponse } from 'next/server';
import { getOrCreateVisitor, getFingerprintFromRequest, getClientInfoFromRequest } from '@/lib/visitors';

export async function POST(request: Request) {
  try {
    const fingerprint = getFingerprintFromRequest(request);
    const { ip, ua } = getClientInfoFromRequest(request);
    const visitor = await getOrCreateVisitor(ip, ua);

    return NextResponse.json({
      fingerprint,
      name: visitor.name,
      originalName: visitor.originalName,
      nameChangedAt: visitor.nameChangedAt,
      canChangeName: !visitor.nameChangedAt,
    });
  } catch {
    return NextResponse.json({ error: '获取访客信息失败' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const fingerprint = getFingerprintFromRequest(request);
    const { ip, ua } = getClientInfoFromRequest(request);
    const visitor = await getOrCreateVisitor(ip, ua);

    return NextResponse.json({
      fingerprint,
      name: visitor.name,
      originalName: visitor.originalName,
      nameChangedAt: visitor.nameChangedAt,
      canChangeName: !visitor.nameChangedAt,
      ip,
      ua: ua.slice(0, 50) + (ua.length > 50 ? '...' : ''),
    });
  } catch {
    return NextResponse.json({ error: '获取访客信息失败' }, { status: 500 });
  }
}
