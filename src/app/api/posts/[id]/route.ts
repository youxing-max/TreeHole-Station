import { NextResponse } from 'next/server';
import { getPosts, savePosts } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getFingerprintFromRequest } from '@/lib/visitors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const trackView = searchParams.get('trackView') !== 'false';
    const data = await getPosts();
    const post = data.posts.find(p => p.id === params.id);
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }
    if (trackView) {
      const fingerprint = getFingerprintFromRequest(request);
      if (!post.viewedBy) post.viewedBy = {};
      // Only count view if this fingerprint hasn't viewed before
      if (!post.viewedBy[fingerprint]) {
        post.viewedBy[fingerprint] = new Date().toISOString();
        post.views++;
        await savePosts(data);
      }
    }
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) {
      return unauthorized;
    }

    const body = await request.json();
    const data = await getPosts();
    const index = data.posts.findIndex(p => p.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const { title, content, summary, tags, coverImage } = body;
    data.posts[index] = {
      ...data.posts[index],
      title: title?.trim() || data.posts[index].title,
      content: content?.trim() || data.posts[index].content,
      summary: summary?.trim() || data.posts[index].summary,
      tags: tags || data.posts[index].tags,
      coverImage: coverImage !== undefined ? coverImage : data.posts[index].coverImage,
      updatedAt: new Date().toISOString(),
    };
    await savePosts(data);
    return NextResponse.json({ post: data.posts[index] });
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) {
      return unauthorized;
    }

    const data = await getPosts();
    const index = data.posts.findIndex(p => p.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }
    data.posts.splice(index, 1);
    await savePosts(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
