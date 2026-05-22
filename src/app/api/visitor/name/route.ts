import { NextResponse } from 'next/server';
import { changeVisitorName, getVisitorByFingerprint, getFingerprintFromRequest, getClientInfoFromRequest } from '@/lib/visitors';

// POST: Change visitor name (can only be done once)
export async function POST(request: Request) {
  try {
    const fingerprint = getFingerprintFromRequest(request);
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '请提供新名字' }, { status: 400 });
    }

    const result = await changeVisitorName(fingerprint, name.trim());

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      name: result.visitor!.name,
      originalName: result.visitor!.originalName,
      nameChangedAt: result.visitor!.nameChangedAt,
    });
  } catch {
    return NextResponse.json({ error: '修改名字失败' }, { status: 500 });
  }
}

// GET: Check if visitor can change name
export async function GET(request: Request) {
  try {
    const fingerprint = getFingerprintFromRequest(request);
    const { ip, ua } = getClientInfoFromRequest(request);
    const visitor = await getVisitorByFingerprint(fingerprint);

    if (!visitor) {
      return NextResponse.json({
        canChange: true,
        hasChanged: false,
        fingerprint,
        ip,
        ua: ua.slice(0, 50) + (ua.length > 50 ? '...' : ''),
      });
    }

    return NextResponse.json({
      canChange: !visitor.nameChangedAt,
      hasChanged: !!visitor.nameChangedAt,
      currentName: visitor.name,
      originalName: visitor.originalName,
      nameChangedAt: visitor.nameChangedAt,
      fingerprint,
      ip,
      ua: ua.slice(0, 50) + (ua.length > 50 ? '...' : ''),
    });
  } catch {
    return NextResponse.json({ error: '获取信息失败' }, { status: 500 });
  }
}
