'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, deleteCookie } from 'cookies-next';

export default function Navbar() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  const fetchUserInfo = async () => {
    try {
      const token = getCookie('auth-token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsername(data.email.split('@')[0]); // 使用邮箱前缀作为显示名
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      router.replace('/login');
    }
  };

  useEffect(() => {
    fetchUserInfo();

    // 监听登录状态变化
    const handleAuthChange = () => {
      fetchUserInfo();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [router]);

  const handleLogout = () => {
    deleteCookie('auth-token', { path: '/' });
    setUsername('');
    router.replace('/login');
  };

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1800px] mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-16">
          <div className="text-xl font-semibold text-gray-800">
            小来Markdown助手
          </div>
          {username && (
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                欢迎，{username}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                登出
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 