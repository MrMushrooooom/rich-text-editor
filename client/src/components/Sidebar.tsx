'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';

interface Document {
  id: string;
  title: string;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    try {
      const token = getCookie('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('获取文档列表失败:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // 监听文档更新事件
    const handleDocumentUpdate = () => {
      fetchDocuments();
    };

    window.addEventListener('document-update', handleDocumentUpdate);
    return () => window.removeEventListener('document-update', handleDocumentUpdate);
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, document: Document) => {
    e.stopPropagation(); // 阻止事件冒泡
    setDocumentToDelete(document);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const token = getCookie('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${documentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
        setShowDeleteModal(false);
        setDocumentToDelete(null);
        
        // 如果删除的是当前文档，跳转到文档列表
        if (pathname === `/documents/${documentToDelete.id}`) {
          router.push('/documents');
        }
      }
    } catch (error) {
      console.error('删除文档失败:', error);
    }
  };

  const handleCreateDocument = async () => {
    try {
      const token = getCookie('auth-token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: '未命名文档',
          content: '<p>开始编辑你的文档...</p>'
        }),
      });

      if (response.ok) {
        const newDoc = await response.json();
        await fetchDocuments(); // 刷新文档列表
        router.push(`/documents/${newDoc.id}`);
      }
    } catch (error) {
      console.error('创建文档失败:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 flex-shrink-0">
        <button 
          onClick={handleCreateDocument}
          className="w-full bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors text-sm"
        >
          + 新建文档
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {documents.map((doc) => (
          <div 
            key={doc.id}
            className={`group px-3 py-1.5 cursor-pointer transition-colors text-sm flex items-center justify-between ${
              pathname === `/documents/${doc.id}` 
                ? 'bg-blue-50 text-blue-600' 
                : 'hover:bg-gray-100'
            }`}
          >
            <div
              className="flex-1 truncate"
              onClick={() => router.push(`/documents/${doc.id}`)}
            >
              {doc.title || '未命名文档'}
            </div>
            <button
              onClick={(e) => handleDeleteClick(e, doc)}
              className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-gray-200 rounded transition-opacity"
              title="删除文档"
            >
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
            <p className="text-sm text-gray-500 mb-4">
              确定要删除文档 "{documentToDelete?.title || '未命名文档'}" 吗？此操作无法撤销。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 