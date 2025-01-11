import { Editor } from '@tiptap/react';
import { useState } from 'react';

// 精心挑选的配色方案
const colors = [
  { name: '默认黑', value: '#000000' },
  { name: '深空灰', value: '#333333' },
  { name: '暖灰色', value: '#666666' },
  { name: '靛青蓝', value: '#0066cc' },
  { name: '天空蓝', value: '#3399ff' },
  { name: '薄荷绿', value: '#00cc99' },
  { name: '森林绿', value: '#2d862d' },
  { name: '珊瑚红', value: '#ff6b6b' },
  { name: '深玫红', value: '#cc3366' },
  { name: '紫水晶', value: '#9966cc' },
  { name: '暖橙色', value: '#ff9933' },
  { name: '深棕色', value: '#994d00' },
];

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-2 mb-4 flex flex-wrap gap-1 items-center bg-white rounded-t-lg">
      {/* 文本样式 */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
        title="加粗"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path>
        </svg>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
        title="斜体"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="4" x2="10" y2="4"></line>
          <line x1="14" y1="20" x2="5" y2="20"></line>
          <line x1="15" y1="4" x2="9" y2="20"></line>
        </svg>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-100' : ''}`}
        title="删除线"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 6 8 8C8 10 10 11 12 12C14 13 16 14 16 16C16 18 14.5 20 12 20C9.5 20 8 18 8 18"></path>
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* 标题 */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100' : ''}`}
        title="大标题"
      >
        H1
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100' : ''}`}
        title="中标题"
      >
        H2
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* 列表 */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-100' : ''}`}
        title="无序列表"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="6" x2="20" y2="6"></line>
          <line x1="9" y1="12" x2="20" y2="12"></line>
          <line x1="9" y1="18" x2="20" y2="18"></line>
          <circle cx="5" cy="6" r="2"></circle>
          <circle cx="5" cy="12" r="2"></circle>
          <circle cx="5" cy="18" r="2"></circle>
        </svg>
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-100' : ''}`}
        title="有序列表"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="10" y1="6" x2="21" y2="6"></line>
          <line x1="10" y1="12" x2="21" y2="12"></line>
          <line x1="10" y1="18" x2="21" y2="18"></line>
          <path d="M4 6h1v4H4zm0 6h1v4H4zm0 6h1v4H4z"></path>
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* 对齐方式 */}
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-100' : ''}`}
        title="左对齐"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="15" y2="12"></line>
          <line x1="3" y1="18" x2="18" y2="18"></line>
        </svg>
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-100' : ''}`}
        title="居中对齐"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="6" y1="12" x2="18" y2="12"></line>
          <line x1="4" y1="18" x2="20" y2="18"></line>
        </svg>
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-100' : ''}`}
        title="右对齐"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="9" y1="12" x2="21" y2="12"></line>
          <line x1="6" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      {/* 颜色选择器 */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded hover:bg-gray-100 flex items-center"
          title="文字颜色"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v18M5 8h14M7 14h10"></path>
          </svg>
        </button>
        
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg grid grid-cols-4 gap-1 z-10">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  editor.chain().focus().setColor(color.value).run();
                  setShowColorPicker(false);
                }}
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* 链接 */}
      <button
        onClick={() => {
          const url = window.prompt('输入链接URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-100' : ''}`}
        title="添加链接"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
        </svg>
      </button>

      {/* 图片上传 */}
      <button
        onClick={() => {
          const url = window.prompt('输入图片URL:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className="p-2 rounded hover:bg-gray-100"
        title="插入图片"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <path d="M21 15l-5-5L5 21"></path>
        </svg>
      </button>
    </div>
  );
} 