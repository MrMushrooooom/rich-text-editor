'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 检查认证状态
    const token = getCookie('auth-token');
    if (!token) {
      // 未登录时重定向到登录页
      router.replace('/login');
    } else {
      // 已登录时重定向到文档列表
      router.replace('/documents');
    }
  }, [router]);

  return null; // 不需要渲染任何内容，因为会立即重定向
}
