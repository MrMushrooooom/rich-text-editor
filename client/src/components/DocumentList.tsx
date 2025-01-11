'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCookie } from 'cookies-next';

interface Document {
  id: string;
  title: string;
  updatedAt: string;
}

export default function DocumentList() {
  const router = useRouter();
  const pathname = usePathname();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  }, []);

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

  const handleDeleteClick = (document: Document) => {
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

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-16">
      <div className="p-4">
        <button
          onClick={handleCreateDocument}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          新建文档
        </button>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-9rem)]">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="group relative hover:bg-gray-50 transition-colors"
              >
                <button
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {doc.title || '未命名文档'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(doc);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                >
                  <svg
                    className="w-4 h-4 text-gray-500 hover:text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
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