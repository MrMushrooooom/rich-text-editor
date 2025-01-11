'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';

export default function App({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  useEffect(() => {
    // 检查认证状态
    const token = document.cookie.includes('auth-token');
    if (!token && window.location.pathname !== '/login') {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* 主要内容 - 添加上边距以避免被固定导航栏遮挡 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-16">
        {children}
      </main>
    </div>
  );
} 