'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCookie } from 'cookies-next';
import Editor from '@/components/Editor';
import dynamic from 'next/dynamic';

// 动态导入 Editor 组件，禁用 SSR
const DynamicEditor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
});

interface Document {
  id: string;
  title: string;
  content: string;
}

export default function DocumentPage() {
  const router = useRouter();
  const params = useParams();
  const [document, setDocument] = useState<Document | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const token = getCookie('auth-token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setDocument(data);
        }
      } catch (error) {
        console.error('获取文档失败:', error);
      }
    };

    if (params?.id) {
      fetchDocument();
    }
  }, [params?.id]);

  const handleSave = async (content: string) => {
    if (!document || !params?.id) return;

    try {
      const token = getCookie('auth-token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: document.title,
          content,
        }),
      });
    } catch (error) {
      console.error('保存文档失败:', error);
    }
  };

  const handleTitleChange = async (title: string) => {
    if (!document || !params?.id) return;

    try {
      const token = getCookie('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: document.content,
        }),
      });
      
      if (response.ok) {
        const updatedDoc = await response.json();
        setDocument(updatedDoc);
        window.dispatchEvent(new Event('document-update'));
      }
    } catch (error) {
      console.error('更新标题失败:', error);
    }
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <DynamicEditor 
      initialContent={document.content}
      initialTitle={document.title}
      onSave={handleSave}
      onTitleChange={handleTitleChange}
    />
  );
} 