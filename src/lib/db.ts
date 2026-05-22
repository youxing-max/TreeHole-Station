import fs from 'fs/promises';
import path from 'path';
import type { MessageData, PostData, DanmakuData } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_POST_CONTENT = `# 欢迎使用 Markdown

这里支持完整的 **Markdown / GFM** 渲染。

## 表格

| 功能 | 状态 |
| --- | --- |
| 表格 | 支持 |
| 代码块 | 支持 |
| 图片 | 支持 |

## 代码

\`\`\`ts
const hello = 'tree-hole';
console.log(hello);
\`\`\`

## 图片

![示例图片](/uploads/demo-cover.svg)
`;
const DEFAULT_POST_SUMMARY = '支持 Markdown、表格、代码块与图片展示的示例文章。';
const DEFAULT_POST_COVER = '/uploads/demo-cover.svg';

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function initJsonFile<T>(filename: string, defaultData: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

export async function getMessages(): Promise<MessageData> {
  return initJsonFile<MessageData>('messages.json', { messages: [], lastId: 0 });
}

export async function saveMessages(data: MessageData): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'messages.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getPosts(): Promise<PostData> {
  const data = await initJsonFile<PostData>('posts.json', { posts: [], lastId: 0 });

  if (data.posts.length === 0) {
    const now = new Date().toISOString();
    data.posts = [
      {
        id: '1',
        title: 'Markdown 示例文章',
        content: DEFAULT_POST_CONTENT,
        summary: DEFAULT_POST_SUMMARY,
        tags: ['markdown', 'demo'],
        coverImage: DEFAULT_POST_COVER,
        createdAt: now,
        updatedAt: now,
        views: 0,
        likeCount: 0,
        favoriteCount: 0,
        likedBy: {},
        favoritedBy: {},
        comments: [],
      },
    ];
    data.lastId = 1;
    await savePosts(data);
  }

  return data;
}

export async function savePosts(data: PostData): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'posts.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getDanmaku(): Promise<DanmakuData> {
  return initJsonFile<DanmakuData>('danmaku.json', { danmaku: [], lastId: 0 });
}

export async function saveDanmaku(data: DanmakuData): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, 'danmaku.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
