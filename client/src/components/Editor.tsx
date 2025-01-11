import { Editor as TiptapEditor, EditorContent, useEditor } from '@tiptap/react'
import { EditorView } from 'prosemirror-view'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import { useCallback, useRef, useState, useEffect } from 'react'
import TurndownService from 'turndown'
import { Extension } from '@tiptap/core'
import Underline from '@tiptap/extension-underline'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import CodeBlock from '@tiptap/extension-code-block'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

// 防抖函数
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// 自定义 Turndown 规则
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',  // 设置无序列表的标记
  strongDelimiter: '**'   // 设置加粗的标记
})

// 添加自定义规则来处理标题
turndownService.addRule('heading', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: function (content, node) {
    const hLevel = node.nodeName.charAt(1)
    return '\n' + '#'.repeat(Number(hLevel)) + ' ' + content + '\n'
  }
})

// 添加自定义规则来处理列表
turndownService.addRule('list', {
  filter: ['ul', 'ol'],
  replacement: function (content, node) {
    const isOrdered = node.nodeName === 'OL';
    const listItems = Array.from(node.children).map((item: Element, index) => {
      // 获取列表项的内容，移除可能存在的多余标记
      let itemContent = turndownService.turndown(item.innerHTML)
        .replace(/^[-\d.\s]+/, '') // 移除已有的列表标记
        .trim();

      // 计算缩进级别
      let level = 0;
      let parent = item.parentElement;
      while (parent && (parent.nodeName === 'UL' || parent.nodeName === 'OL')) {
        level++;
        parent = parent.parentElement;
      }

      // 根据层级添加缩进和标记
      const indent = '  '.repeat(level - 1);
      const marker = isOrdered ? `${index + 1}.` : '-';
      
      // 处理多行内容，保持缩进，移除多余空行
      return itemContent
        .split('\n')
        .filter(line => line.trim()) // 移除空行
        .map((line, i) => {
          if (i === 0) {
            return `${indent}${marker} ${line}`;
          }
          return `${indent}  ${line}`;
        })
        .join('\n');
    }).join('\n');

    // 移除开头和结尾的多余空行，确保只有一个换行符
    return '\n' + listItems.trim() + '\n';
  }
});

// 添加自定义规则来处理带样式的文本
turndownService.addRule('styledText', {
  filter: function(node: Node): boolean {
    return (
      node.nodeName === 'SPAN' && 
      !!(node as HTMLElement).style.color || !!(node as HTMLElement).style.fontSize
    )
  },
  replacement: function(content: string, node: Node): string {
    const element = node as HTMLElement
    const styles = []
    if (element.style.color) {
      styles.push(`color: ${element.style.color}`)
    }
    if (element.style.fontSize) {
      styles.push(`font-size: ${element.style.fontSize}`)
    }
    if (styles.length === 0) return content
    return `<span style="${styles.join(';')}">${content}</span>`
  }
})

// 添加自定义规则来处理图片对齐
turndownService.addRule('alignedImage', {
  filter: function(node: Node): boolean {
    return node.nodeName === 'IMG'
  },
  replacement: function(content: string, node: Node): string {
    const element = node as HTMLElement
    const src = element.getAttribute('src') || ''
    const width = element.style.width
    const align = element.style.marginLeft === 'auto' && element.style.marginRight === 'auto' ? 'center' :
                 element.style.marginLeft === 'auto' ? 'right' : 'left'
    
    let markdown = `![](${src})`
    if (width || align !== 'left') {
      markdown += ` {`
      if (width) markdown += ` width="${width}"`
      if (align !== 'left') markdown += ` align="${align}"`
      markdown += ` }`
    }
    return markdown
  }
})

// 添加自定义规则来处理任务列表
turndownService.addRule('taskListItems', {
  filter: (node) => {
    return node.nodeName === 'LI' && node.hasAttribute('data-type') && node.getAttribute('data-type') === 'taskItem';
  },
  replacement: function (content, node) {
    const isChecked = (node as HTMLElement).getAttribute('data-checked') === 'true';
    return `- [${isChecked ? 'x' : ' '}] ${content.trim()}\n`;
  }
});

// 添加下划线转换规则
turndownService.addRule('underline', {
  filter: (node) => {
    return node.nodeName === 'U' || 
           (node.nodeName === 'SPAN' && (node as HTMLElement).style.textDecoration === 'underline');
  },
  replacement: function (content) {
    return `<u>${content}</u>`;
  }
});

// 创建自定义扩展来处理列表行为
const ListKeymap = Extension.create({
  name: 'listKeymap',
  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => {
        // 如果在空的列表项中按回车，退出列表
        const { empty, $anchor } = editor.state.selection
        const node = $anchor.node()
        
        if (empty && (node.type.name === 'listItem') && node.textContent === '') {
          return editor.commands.liftListItem('listItem')
        }
        
        return false
      },
      'Backspace': ({ editor }) => {
        // 如果在列表项开始处按退格，退出列表
        const { empty, $anchor } = editor.state.selection
        const isAtStart = $anchor.pos === $anchor.start()
        
        if (empty && isAtStart && editor.isActive('listItem')) {
          return editor.commands.liftListItem('listItem')
        }
        
        return false
      },
    }
  },
})

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
]

interface EditorProps {
  initialContent?: string;
  initialTitle?: string;
  onSave?: (content: string) => void;
  onTitleChange?: (title: string) => void;
}

const Editor = ({ initialContent, initialTitle, onSave, onTitleChange }: EditorProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [showMarkdown, setShowMarkdown] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [title, setTitle] = useState(initialTitle || '未命名文档')

  // 在组件挂载和 initialTitle 更新时设置标题
  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  // 使用防抖处理标题更新
  const debouncedTitleChange = useCallback(
    debounce((newTitle: string) => {
      onTitleChange?.(newTitle);
    }, 500),
    [onTitleChange]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedTitleChange(newTitle);
  };

  // 使用防抖处理内容更新和保存
  const debouncedSave = useCallback(
    debounce((html: string) => {
      const md = turndownService.turndown(html);
      setMarkdown(md);
      onSave?.(html);
    }, 1000),
    [onSave]
  );

  // 记录上一次的内容
  const lastContentRef = useRef<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        code: {
          HTMLAttributes: {
            class: 'bg-gray-100 rounded px-1.5 py-1',
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full cursor-pointer',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      Underline,
      Superscript,
      Subscript,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-lg p-4 font-mono text-sm',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      ListKeymap,
    ],
    content: initialContent || '<p>开始编辑你的文档...</p>',
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        // 忽略输入法组合过程中的事件
        if (event.isComposing) {
          return false;
        }

        if (event.key === 'Tab') {
          if (!editor?.isActive('listItem')) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      handleClick: (view, pos, event) => {
        const element = event.target as HTMLElement
        if (element.tagName === 'IMG') {
          const img = element as HTMLImageElement
          setSelectedImage(img)
          return true
        }
        setSelectedImage(null)
        return false
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files.length) {
          const files = Array.from(event.dataTransfer.files)
          const images = files.filter(file => file.type.startsWith('image/'))
          
          if (images.length === 0) return false
          
          event.preventDefault()
          
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })
          
          images.forEach(image => {
            const reader = new FileReader()
            reader.onload = (readerEvent) => {
              const imageUrl = readerEvent.target?.result as string
              if (coordinates?.pos !== undefined && editor?.schema.nodes.image) {
                const node = editor.schema.nodes.image.create({ src: imageUrl })
                const transaction = view.state.tr.insert(coordinates.pos, node)
                view.dispatch(transaction)
                // 设置新插入图片的初始大小
                setTimeout(() => {
                  const newImage = editorRef.current?.querySelector(`img[src="${imageUrl}"]`) as HTMLImageElement
                  if (newImage) {
                    const editorWidth = editorRef.current?.clientWidth || 0
                    newImage.style.width = `${editorWidth * 0.3}px` // 初始宽度为编辑器宽度的 30%
                    newImage.style.height = 'auto' // 高度自动调整保持比例
                  }
                }, 0)
              }
            }
            reader.readAsDataURL(image)
          })
          
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      // 如果正在输入法组合过程中，不触发保存
      if (editor.view.composing) {
        return;
      }
      const html = editor.getHTML();
      lastContentRef.current = html; // 更新最后的内容
      debouncedSave(html);
    }
  });

  // 定时检查内容变化
  useEffect(() => {
    if (!editor) return;

    const checkContent = () => {
      const currentContent = editor.getHTML();
      if (currentContent !== lastContentRef.current) {
        lastContentRef.current = currentContent;
        debouncedSave(currentContent);
      }
    };

    const intervalId = setInterval(checkContent, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [editor, debouncedSave]);

  // 在显示 Markdown 时立即更新内容
  useEffect(() => {
    if (showMarkdown && editor) {
      const html = editor.getHTML()
      const md = turndownService.turndown(html)
      setMarkdown(md)
    }
  }, [showMarkdown, editor])

  // 同步滚动
  useEffect(() => {
    const editorContainer = editorRef.current?.parentElement;
    const previewElement = previewRef.current;

    if (!editorContainer || !previewElement || !showMarkdown) {
      return;
    }

    const handleScroll = () => {
      if (previewElement.parentElement) {
        previewElement.parentElement.scrollTop = editorContainer.scrollTop;
      }
    };

    editorContainer.addEventListener('scroll', handleScroll);
    
    return () => {
      editorContainer.removeEventListener('scroll', handleScroll);
    };
  }, [showMarkdown]);

  // 更新调整手柄位置
  useEffect(() => {
    if (selectedImage && resizeRef.current && editorRef.current) {
      const editorElement = editorRef.current;
      const resizeElement = resizeRef.current;

      const updateResizeHandles = () => {
        if (!selectedImage || !editorElement) return;
        
        const rect = selectedImage.getBoundingClientRect();
        const editorRect = editorElement.getBoundingClientRect();
        
        // 计算图片相对于编辑器容器的位置
        const relativeLeft = rect.left - editorRect.left + editorElement.scrollLeft;
        const relativeTop = rect.top - editorRect.top + editorElement.scrollTop;

        resizeElement.style.position = 'absolute';
        resizeElement.style.left = `${relativeLeft}px`;
        resizeElement.style.top = `${relativeTop}px`;
        resizeElement.style.width = `${rect.width}px`;
        resizeElement.style.height = `${rect.height}px`;
      };

      // 初始更新位置
      updateResizeHandles();

      // 监听编辑器的滚动事件
      const handleScroll = () => {
        requestAnimationFrame(updateResizeHandles);
      };

      // 监听窗口大小变化
      const handleResize = () => {
        requestAnimationFrame(updateResizeHandles);
      };

      // 创建 MutationObserver 来监听编辑器内容变化
      const observer = new MutationObserver(() => {
        requestAnimationFrame(updateResizeHandles);
      });

      // 监听编辑器内容变化
      const proseMirrorElement = editorElement.querySelector('.ProseMirror');
      if (proseMirrorElement) {
        observer.observe(proseMirrorElement, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      }

      // 添加事件监听器
      editorElement.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize);
      document.addEventListener('selectionchange', updateResizeHandles);

      // 定期更新位置，以防万一
      const intervalId = setInterval(updateResizeHandles, 100);

      return () => {
        observer.disconnect();
        editorElement.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('selectionchange', updateResizeHandles);
        clearInterval(intervalId);
      };
    }
  }, [selectedImage]);

  // 处理图片点击
  const handleImageClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedImage(target as HTMLImageElement);
    } else if (!target.closest('.resize-handle')) {
      setSelectedImage(null);
    }
  }, []);

  // 添加全局点击事件监听
  useEffect(() => {
    if (editorRef.current) {
      const editorElement = editorRef.current;
      editorElement.addEventListener('click', handleImageClick);
      
      return () => {
        editorElement.removeEventListener('click', handleImageClick);
      };
    }
  }, [handleImageClick]);

  const handleExportMarkdown = useCallback(() => {
    if (editor) {
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'document.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [editor, markdown])

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && editor) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        editor.chain().focus().setImage({ src: imageUrl }).run()
        // 设置新插入图片的初始大小
        setTimeout(() => {
          const newImage = editorRef.current?.querySelector(`img[src="${imageUrl}"]`) as HTMLImageElement
          if (newImage) {
            const editorWidth = editorRef.current?.clientWidth || 0
            newImage.style.width = `${editorWidth * 0.3}px` // 初始宽度为编辑器宽度的 30%
            newImage.style.height = 'auto' // 高度自动调整保持比例
          }
        }, 0)
      }
      reader.readAsDataURL(file)
    }
  }, [editor])

  const handleImageAlign = useCallback((alignment: 'left' | 'center' | 'right') => {
    if (selectedImage) {
      selectedImage.style.display = 'block'
      if (alignment === 'left') {
        selectedImage.style.marginLeft = '0'
        selectedImage.style.marginRight = 'auto'
      } else if (alignment === 'center') {
        selectedImage.style.marginLeft = 'auto'
        selectedImage.style.marginRight = 'auto'
      } else {
        selectedImage.style.marginLeft = 'auto'
        selectedImage.style.marginRight = '0'
      }
      editor?.commands.focus()
    }
  }, [selectedImage, editor])

  const handleImageResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>, direction: string) => {
    if (!selectedImage || !editorRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = selectedImage.offsetWidth;
    const startHeight = selectedImage.offsetHeight;
    const aspectRatio = startWidth / startHeight;
    
    const editorRect = editorRef.current.getBoundingClientRect();
    const maxWidth = editorRect.width * 0.8; // 最大宽度为编辑器宽度的 80%

    const handleMouseMove = (e: MouseEvent) => {
      let deltaX = 0;
      let deltaY = 0;
      let newWidth = startWidth;
      let newHeight = startHeight;

      // 计算拖动距离
      if (direction.includes('right')) {
        deltaX = e.clientX - startX;
      } else if (direction.includes('left')) {
        deltaX = startX - e.clientX;
      }
      if (direction.includes('bottom')) {
        deltaY = e.clientY - startY;
      } else if (direction.includes('top')) {
        deltaY = startY - e.clientY;
      }

      // 根据拖动方向和距离计算新尺寸
      if (direction.includes('right') || direction.includes('left')) {
        // 水平拖动时，以宽度变化为主，高度按比例计算
        newWidth = Math.min(Math.max(50, startWidth + deltaX), maxWidth);
        newHeight = newWidth / aspectRatio;
      } else if (direction.includes('top') || direction.includes('bottom')) {
        // 垂直拖动时，以高度变化为主，宽度按比例计算
        newHeight = Math.min(Math.max(50, startHeight + deltaY), maxWidth / aspectRatio);
        newWidth = newHeight * aspectRatio;
      }

      // 应用新的尺寸，保持宽高比
      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = `${newHeight}px`;

      // 触发重新计算手柄位置
      window.dispatchEvent(new Event('resize'));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      editor?.commands.focus();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [selectedImage, editor]);

  if (!editor) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white h-full">
      {/* 文档标题区域 - 固定在顶部 */}
      <div className="editor-title flex items-center px-4 py-2 border-b bg-white">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={() => onTitleChange?.(title)}
          className="text-xl font-medium w-full focus:outline-none"
          placeholder="未命名文档"
        />
      </div>

      {/* 工具栏 - 固定在标题下方 */}
      <div className="editor-toolbar flex items-center gap-2 px-4 py-2 border-b bg-white">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('heading', { level: 1 }) ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="大标题"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('heading', { level: 2 }) ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="中标题"
            >
              H2
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('bold') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="加粗"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('italic') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="斜体"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('underline') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="下划线"
            >
              U
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('strike') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="删除线"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 6 8 8C8 10 10 11 12 12C14 13 16 14 16 16C16 18 14.5 20 12 20C9.5 20 8 18 8 18"></path>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('bulletList') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
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
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('orderedList') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="有序列表"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="21" y2="6"></line>
                <line x1="10" y1="12" x2="21" y2="12"></line>
                <line x1="10" y1="18" x2="21" y2="18"></line>
                <path d="M4 6h1v4H4zm0 6h1v4H4z"></path>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('taskList') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="任务列表"
            >
              ☑️
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('code') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="行内代码"
            >
              <code>{'<>'}</code>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('codeBlock') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="代码块"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('highlight') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="文本高亮"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('superscript') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="上标"
            >
              x²
            </button>
            <button
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive('subscript') ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="下标"
            >
              x₂
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive({ textAlign: 'left' }) ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
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
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive({ textAlign: 'center' }) ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
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
              className={`p-2 rounded-md hover:bg-white hover:shadow-sm transition-all ${
                editor.isActive({ textAlign: 'right' }) ? 'bg-white shadow-sm text-blue-600' : ''
              }`}
              title="右对齐"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="9" y1="12" x2="21" y2="12"></line>
                <line x1="6" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* 颜色选择器 */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded hover:bg-gray-100 flex items-center gap-1"
            >
              文字颜色
              <div className="w-4 h-4 border border-gray-300 rounded-sm" style={{ 
                backgroundColor: editor.getAttributes('textStyle').color || '#000000' 
              }} />
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-50 grid grid-cols-3 gap-1 w-[280px]">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      editor.chain().focus().setColor(color.value).run()
                      setShowColorPicker(false)
                    }}
                    className="p-2 rounded hover:bg-gray-100 flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color.value }} />
                    <span className="text-sm">{color.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 图片上传 */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded hover:bg-gray-100"
          >
            插入图片
          </button>

          {selectedImage && (
            <>
              <div className="h-6 w-px bg-gray-300 mx-2" />
              <button
                onClick={() => handleImageAlign('left')}
                className="p-2 rounded hover:bg-gray-100"
                title="左对齐"
              >
                ⬅️
              </button>
              <button
                onClick={() => handleImageAlign('center')}
                className="p-2 rounded hover:bg-gray-100"
                title="居中"
              >
                ⬆️
              </button>
              <button
                onClick={() => handleImageAlign('right')}
                className="p-2 rounded hover:bg-gray-100"
                title="右对齐"
              >
                ➡️
              </button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className={`px-3 py-1.5 rounded ${showMarkdown ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            {showMarkdown ? '隐藏 Markdown' : '显示 Markdown'}
          </button>
          <button
            onClick={handleExportMarkdown}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            导出 Markdown
          </button>
        </div>
      </div>
      
      {/* 编辑器内容区域 - 可滚动 */}
      <div className="flex-1 overflow-hidden flex">
        <div className={`${showMarkdown ? 'w-1/2' : 'w-full'} h-full overflow-y-auto relative`}>
          <EditorContent 
            editor={editor} 
            className="h-full"
            ref={editorRef}
          />
          
          {selectedImage && (
            <div 
              ref={resizeRef}
              className="absolute pointer-events-none image-resize-frame"
              style={{
                border: '1px solid #3b82f6',
                boxSizing: 'border-box'
              }}
            >
              <div className="resize-handle top-left" onMouseDown={(e) => handleImageResizeStart(e, 'top-left')} />
              <div className="resize-handle top-right" onMouseDown={(e) => handleImageResizeStart(e, 'top-right')} />
              <div className="resize-handle bottom-left" onMouseDown={(e) => handleImageResizeStart(e, 'bottom-left')} />
              <div className="resize-handle bottom-right" onMouseDown={(e) => handleImageResizeStart(e, 'bottom-right')} />
              <div className="resize-handle top" onMouseDown={(e) => handleImageResizeStart(e, 'top')} />
              <div className="resize-handle right" onMouseDown={(e) => handleImageResizeStart(e, 'right')} />
              <div className="resize-handle bottom" onMouseDown={(e) => handleImageResizeStart(e, 'bottom')} />
              <div className="resize-handle left" onMouseDown={(e) => handleImageResizeStart(e, 'left')} />
            </div>
          )}
        </div>
        
        {showMarkdown && (
          <div className="w-1/2 h-full border-l bg-white overflow-y-auto">
            <div 
              ref={previewRef}
              className="font-mono text-sm whitespace-pre-wrap p-4"
              style={{
                paddingTop: "calc(4rem + 1px)"
              }}
            >
              {markdown}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .ProseMirror {
          padding: 1.5rem;
          min-height: 100%;
          outline: none;
          position: relative;
          z-index: 1;
        }

        .ProseMirror > * + * {
          margin-top: 0.75em;
        }

        /* 标题样式 */
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }

        /* 列表样式 */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror ul ul,
        .ProseMirror ol ol,
        .ProseMirror ul ol,
        .ProseMirror ol ul {
          padding-left: 2em;
          margin: 0;
        }

        .ProseMirror ul {
          list-style-type: disc;
        }

        .ProseMirror ul ul {
          list-style-type: circle;
        }

        .ProseMirror ul ul ul {
          list-style-type: square;
        }

        .ProseMirror ol {
          list-style-type: decimal;
        }

        .ProseMirror ol ol {
          list-style-type: lower-alpha;
        }

        .ProseMirror ol ol ol {
          list-style-type: lower-roman;
        }

        .ProseMirror li {
          margin: 0.3em 0;
          position: relative;
        }

        .ProseMirror li p {
          margin: 0;
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
          transition: none;
          border: 1px solid transparent;
          position: relative;
          z-index: 2;
          margin: 1rem 0;
          display: block;
        }
        
        .ProseMirror img:hover {
          border: 1px solid #3b82f6;
        }

        .resize-handle {
          position: absolute;
          width: 12px;
          height: 12px;
          background-color: white;
          border: 2px solid #3b82f6;
          border-radius: 50%;
          pointer-events: auto;
          z-index: 3;
        }

        .resize-handle.top-left { top: -6px; left: -6px; cursor: nw-resize; }
        .resize-handle.top-right { top: -6px; right: -6px; cursor: ne-resize; }
        .resize-handle.bottom-left { bottom: -6px; left: -6px; cursor: sw-resize; }
        .resize-handle.bottom-right { bottom: -6px; right: -6px; cursor: se-resize; }
        .resize-handle.top { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .resize-handle.right { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
        .resize-handle.bottom { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .resize-handle.left { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }

        .editor-content {
          position: relative;
          z-index: 1;
        }

        .editor-title {
          position: sticky;
          top: 16px;
          z-index: 30;
          background: white;
        }

        .editor-toolbar {
          position: sticky;
          top: 104px;
          z-index: 20;
          background: white;
        }

        .image-resize-frame {
          position: absolute;
          pointer-events: none;
          z-index: 10;
          overflow: visible;
        }

        /* 任务列表样式 */
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        .ProseMirror li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin: 0.5em 0;
        }

        .ProseMirror li[data-type="taskItem"] > label {
          margin-right: 0.5em;
        }

        .ProseMirror li[data-type="taskItem"] > div {
          flex: 1;
          margin: 0;
          word-break: break-word;
        }

        .ProseMirror li[data-type="taskItem"] > label input[type="checkbox"] {
          margin: 0;
          margin-top: 0.3em;
        }
      `}</style>
    </div>
  )
}

export default Editor 