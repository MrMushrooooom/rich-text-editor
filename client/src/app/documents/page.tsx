'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

export default function DocumentsPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <h1 className="text-2xl font-medium mb-2">选择或创建文档</h1>
        <p>从左侧选择一个文档或创建新文档开始编辑</p>
      </div>
    </div>
  );
} 