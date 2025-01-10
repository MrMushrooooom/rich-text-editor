import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import { useCallback, useRef, useState, useEffect } from 'react'
import TurndownService from 'turndown'
import { Extension } from '@tiptap/core'

// 自定义 Turndown 规则
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

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

const Editor = () => {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [showMarkdown, setShowMarkdown] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [resizingImage, setResizingImage] = useState(false)
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 })
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false, // 重要：这可以防止保留不必要的属性
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full cursor-pointer',
        },
      }),
      Link,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      ListKeymap, // 添加自定义列表行为
    ],
    content: '<p>开始编辑你的文档...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        // 如果按Tab键，阻止默认行为
        if (event.key === 'Tab') {
          const { selection } = view.state
          const { empty, $anchor } = selection
          
          // 只在列表项内允许Tab缩进
          if (!editor?.isActive('listItem')) {
            event.preventDefault()
            return true
          }
        }
        return false
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
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const md = turndownService.turndown(html)
      setMarkdown(md)
    }
  })

  // 同步滚动
  useEffect(() => {
    const editorElement = editorRef.current
    const previewElement = previewRef.current

    if (!editorElement || !previewElement || !showMarkdown) return

    const handleScroll = () => {
      const editorScrollPercentage = editorElement.scrollTop / (editorElement.scrollHeight - editorElement.clientHeight)
      const previewTargetScrollTop = editorScrollPercentage * (previewElement.scrollHeight - previewElement.clientHeight)
      
      // 只有当滚动差异大于一定阈值时才同步，避免无限循环
      if (Math.abs(previewElement.scrollTop - previewTargetScrollTop) > 5) {
        previewElement.scrollTop = previewTargetScrollTop
      }
    }

    const handlePreviewScroll = () => {
      const previewScrollPercentage = previewElement.scrollTop / (previewElement.scrollHeight - previewElement.clientHeight)
      const editorTargetScrollTop = previewScrollPercentage * (editorElement.scrollHeight - editorElement.clientHeight)
      
      // 只有当滚动差异大于一定阈值时才同步，避免无限循环
      if (Math.abs(editorElement.scrollTop - editorTargetScrollTop) > 5) {
        editorElement.scrollTop = editorTargetScrollTop
      }
    }

    editorElement.addEventListener('scroll', handleScroll)
    previewElement.addEventListener('scroll', handlePreviewScroll)
    
    return () => {
      editorElement.removeEventListener('scroll', handleScroll)
      previewElement.removeEventListener('scroll', handlePreviewScroll)
    }
  }, [showMarkdown])

  // 更新调整手柄位置
  useEffect(() => {
    if (selectedImage && resizeRef.current) {
      const updateResizeHandles = () => {
        const rect = selectedImage.getBoundingClientRect()
        const editorRect = editorRef.current?.getBoundingClientRect()
        if (!editorRect) return

        const relativeLeft = rect.left - editorRect.left
        const relativeTop = rect.top - editorRect.top

        resizeRef.current!.style.position = 'absolute'
        resizeRef.current!.style.left = `${relativeLeft}px`
        resizeRef.current!.style.top = `${relativeTop}px`
        resizeRef.current!.style.width = `${rect.width}px`
        resizeRef.current!.style.height = `${rect.height}px`
      }

      updateResizeHandles()

      const observer = new ResizeObserver(updateResizeHandles)
      observer.observe(selectedImage)

      window.addEventListener('resize', updateResizeHandles)
      window.addEventListener('scroll', updateResizeHandles)
      
      return () => {
        observer.disconnect()
        window.removeEventListener('resize', updateResizeHandles)
        window.removeEventListener('scroll', updateResizeHandles)
      }
    }
  }, [selectedImage])

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
    if (!selectedImage || !editorRef.current) return

    e.preventDefault()
    e.stopPropagation()
    
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = selectedImage.offsetWidth
    const startHeight = selectedImage.offsetHeight
    const aspectRatio = startWidth / startHeight
    
    const editorRect = editorRef.current.getBoundingClientRect()
    const maxWidth = editorRect.width - 40 // 留出一些边距

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth
      let newHeight = startHeight

      if (direction.includes('right')) {
        newWidth = startWidth + (e.clientX - startX)
      } else if (direction.includes('left')) {
        newWidth = startWidth - (e.clientX - startX)
      }

      if (direction.includes('bottom')) {
        newHeight = startHeight + (e.clientY - startY)
        newWidth = newHeight * aspectRatio
      } else if (direction.includes('top')) {
        newHeight = startHeight - (e.clientY - startY)
        newWidth = newHeight * aspectRatio
      }

      // 确保宽度在合理范围内
      newWidth = Math.min(Math.max(50, newWidth), maxWidth)
      newHeight = newWidth / aspectRatio

      selectedImage.style.width = `${newWidth}px`
      selectedImage.style.height = `${newHeight}px`

      // 触发重新计算手柄位置
      const event = new Event('resize')
      window.dispatchEvent(event)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      editor?.commands.focus()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [selectedImage, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto h-screen">
      {/* 固定在顶部的工具栏 */}
      <div className="flex gap-2 p-4 border-b flex-wrap items-center bg-white sticky top-0 z-10">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          加粗
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          斜体
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          无序列表
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        >
          有序列表
        </button>
        <button
          onClick={() => {
            const url = window.prompt('输入链接URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`p-2 rounded ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
        >
          添加链接
        </button>

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
      
      {/* 内容区域 */}
      <div className={`flex gap-4 flex-1 min-h-0 p-4 ${showMarkdown ? 'divide-x' : ''}`}>
        <div className={`${showMarkdown ? 'w-1/2' : 'w-full'} relative flex flex-col min-h-0`}>
          <EditorContent 
            editor={editor} 
            className="flex-1 border rounded overflow-auto"
            ref={editorRef}
          />
          
          {selectedImage && (
            <div 
              ref={resizeRef}
              className="absolute pointer-events-none"
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
          <div className="w-1/2 pl-4 flex flex-col min-h-0">
            <div 
              ref={previewRef}
              className="flex-1 border rounded overflow-auto font-mono text-sm whitespace-pre-wrap"
            >
              {markdown}
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .ProseMirror {
          padding: 1rem;
          min-height: 100%;
          > * + * {
            margin-top: 0.75em;
          }
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
          transition: none;
          border: 1px solid transparent;
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
          z-index: 100;
        }

        .resize-handle.top-left { top: -6px; left: -6px; cursor: nw-resize; }
        .resize-handle.top-right { top: -6px; right: -6px; cursor: ne-resize; }
        .resize-handle.bottom-left { bottom: -6px; left: -6px; cursor: sw-resize; }
        .resize-handle.bottom-right { bottom: -6px; right: -6px; cursor: se-resize; }

        .resize-handle.top { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .resize-handle.right { right: -6px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
        .resize-handle.bottom { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .resize-handle.left { left: -6px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
      `}</style>
    </div>
  )
}

export default Editor 