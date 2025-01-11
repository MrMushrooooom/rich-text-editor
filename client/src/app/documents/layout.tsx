'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import Sidebar from '@/components/Sidebar';

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // 检查认证状态
    const token = getCookie('auth-token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex h-[calc(100vh-64px)] mt-16">
      {/* 左侧菜单栏 - 独立滚动 */}
      <div className="w-60 border-r flex-shrink-0 overflow-y-auto bg-gray-50">
        <Sidebar />
      </div>
      
      {/* 右侧编辑区 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
} 