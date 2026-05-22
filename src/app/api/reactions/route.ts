import { NextResponse } from 'next/server';
import { getMessages, saveMessages, getPosts, savePosts } from '@/lib/db';
import { getOrCreateVisitor, getFingerprintFromRequest, getClientInfoFromRequest } from '@/lib/visitors';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetType, targetId, action } = body;

    if (!targetType || !targetId || !action) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    if (!['message', 'post'].includes(targetType)) {
      return NextResponse.json({ error: '不支持的目标类型' }, { status: 400 });
    }

    if (!['like', 'favorite'].includes(action)) {
      return NextResponse.json({ error: '不支持的操作类型' }, { status: 400 });
    }

    const fingerprint = getFingerprintFromRequest(request);
    const { ip, ua } = getClientInfoFromRequest(request);
    const visitor = await getOrCreateVisitor(ip, ua);
    const visitorName = visitor.name;

    if (targetType === 'message') {
      const data = await getMessages();
      const message = data.messages.find(m => m.id === targetId);
      if (!message) {
        return NextResponse.json({ error: '留言不存在' }, { status: 404 });
      }

      if (!message.likedBy) message.likedBy = {};
      if (!message.favoritedBy) message.favoritedBy = {};

      const recordKey = action === 'like' ? 'likedBy' : 'favoritedBy';
      const countKey = action === 'like' ? 'likeCount' : 'favoriteCount';
      const alreadyDone = !!message[recordKey][fingerprint];

      if (alreadyDone) {
        delete message[recordKey][fingerprint];
        message[countKey] = Math.max(0, (message[countKey] || 1) - 1);
      } else {
        message[recordKey][fingerprint] = visitorName;
        message[countKey] = (message[countKey] || 0) + 1;
      }

      await saveMessages(data);

      return NextResponse.json({
        likeCount: message.likeCount || 0,
        favoriteCount: message.favoriteCount || 0,
        liked: !!message.likedBy[fingerprint],
        favorited: !!message.favoritedBy[fingerprint],
      });
    }

    if (targetType === 'post') {
      const data = await getPosts();
      const post = data.posts.find(p => p.id === targetId);
      if (!post) {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      }

      if (!post.likedBy) post.likedBy = {};
      if (!post.favoritedBy) post.favoritedBy = {};

      const recordKey = action === 'like' ? 'likedBy' : 'favoritedBy';
      const countKey = action === 'like' ? 'likeCount' : 'favoriteCount';
      const alreadyDone = !!post[recordKey][fingerprint];

      if (alreadyDone) {
        delete post[recordKey][fingerprint];
        post[countKey] = Math.max(0, (post[countKey] || 1) - 1);
      } else {
        post[recordKey][fingerprint] = visitorName;
        post[countKey] = (post[countKey] || 0) + 1;
      }

      await savePosts(data);

      return NextResponse.json({
        likeCount: post.likeCount || 0,
        favoriteCount: post.favoriteCount || 0,
        liked: !!post.likedBy[fingerprint],
        favorited: !!post.favoritedBy[fingerprint],
      });
    }

    return NextResponse.json({ error: '未知错误' }, { status: 500 });
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const targetIds = searchParams.get('targetIds');

    // Batch mode: return reaction state for multiple IDs
    if (targetIds && targetType) {
      const ids = targetIds.split(',').filter(Boolean);
      const fingerprint = getFingerprintFromRequest(request);
      const result: Record<string, { liked: boolean; favorited: boolean }> = {};

      if (targetType === 'message') {
        const data = await getMessages();
        for (const id of ids) {
          const msg = data.messages.find(m => m.id === id);
          result[id] = {
            liked: !!(msg?.likedBy || {})[fingerprint],
            favorited: !!(msg?.favoritedBy || {})[fingerprint],
          };
        }
      } else if (targetType === 'post') {
        const data = await getPosts();
        for (const id of ids) {
          const post = data.posts.find(p => p.id === id);
          result[id] = {
            liked: !!(post?.likedBy || {})[fingerprint],
            favorited: !!(post?.favoritedBy || {})[fingerprint],
          };
        }
      }
      return NextResponse.json(result);
    }

    // Single mode
    if (!targetType || !targetId) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const fingerprint = getFingerprintFromRequest(request);

    if (targetType === 'message') {
      const data = await getMessages();
      const message = data.messages.find(m => m.id === targetId);
      if (!message) {
        return NextResponse.json({ error: '留言不存在' }, { status: 404 });
      }
      return NextResponse.json({
        liked: !!(message.likedBy || {})[fingerprint],
        favorited: !!(message.favoritedBy || {})[fingerprint],
      });
    }

    if (targetType === 'post') {
      const data = await getPosts();
      const post = data.posts.find(p => p.id === targetId);
      if (!post) {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      }
      return NextResponse.json({
        liked: !!(post.likedBy || {})[fingerprint],
        favorited: !!(post.favoritedBy || {})[fingerprint],
      });
    }

    return NextResponse.json({ error: '不支持的目标类型' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
