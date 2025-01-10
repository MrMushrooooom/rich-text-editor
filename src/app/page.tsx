import ClientEditor from '@/components/ClientEditor'

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">在线文档编辑器</h1>
        <p className="text-gray-600">像编辑Word一样写文档，一键导出Markdown</p>
      </header>
      <ClientEditor />
    </div>
  );
}
