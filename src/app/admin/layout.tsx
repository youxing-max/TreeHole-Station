import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '后台管理',
  description: '树洞小站后台管理。',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
