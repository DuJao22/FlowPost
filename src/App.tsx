import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { Copy, ExternalLink, Trash2, Upload, FileCode2, Eye, LayoutDashboard, Server, Download, AlertCircle, Bot } from 'lucide-react';

interface Page {
  id: string;
  name?: string;
  created_at: string;
  expires_at: string | null;
  views: number;
}

export default function App() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [htmlInput, setHtmlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'tutorial'>('dashboard');
  const [expiresInDays, setExpiresInDays] = useState('0');
  const [pageName, setPageName] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.pages);
      }
    } catch (error) {
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadMethod === 'text' && !htmlInput.trim()) {
      toast.error('Please enter some HTML content');
      return;
    }

    if (uploadMethod === 'file' && !selectedFile) {
      toast.error('Please select an HTML file');
      return;
    }

    setIsUploading(true);
    try {
      let res;
      if (uploadMethod === 'text') {
        res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            html: htmlInput,
            name: pageName.trim() || undefined,
            expiresInDays: expiresInDays !== '0' ? expiresInDays : undefined
          }),
        });
      } else {
        if (!selectedFile) return;
        const fileContent = await selectedFile.text();
        res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: fileContent,
            name: pageName.trim() || selectedFile.name || undefined,
            expiresInDays: expiresInDays !== '0' ? expiresInDays : undefined
          }),
        });
      }
      
      const data = await res.json();
      if (data.success) {
        toast.success('Page uploaded successfully!');
        setHtmlInput('');
        setPageName('');
        setSelectedFile(null);
        setActiveTab('dashboard');
        fetchPages();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Page deleted');
        setPages(pages.filter(p => p.id !== id));
      }
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/view/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await fetch(`/view/${id}`);
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download page');
    }
  };

  const automationPrompt = `Atue como um especialista em automação e desenvolvimento web.
Preciso de um fluxo (ou script) que faça o seguinte:

1. Gere um código HTML completo, moderno e funcional (com CSS/JS embutidos) com base no que eu pedir.
2. Faça o deploy automático desse HTML enviando um POST para a API do meu servidor.

DADOS DA API:
- Endpoint: ${typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.com'}/api/upload
- Método: POST
- Headers: Content-Type: application/json
- Body: { "name": "Nome do Site", "html": "<seu_codigo_html_gerado_aqui>" }

3. A API retornará um JSON de sucesso contendo a propriedade "url". 
Pegue essa URL e me entregue APENAS o link final clicável para eu acessar o site hospedado na hora!`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(automationPrompt);
    toast.success('Prompt copiado para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans">
      <Toaster position="top-right" theme="dark" />
      
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Server className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-50">FlowHost</h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg border border-neutral-700/50">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-neutral-700 shadow-sm text-neutral-50' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-neutral-700 shadow-sm text-neutral-50' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
            <button 
              onClick={() => setActiveTab('tutorial')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'tutorial' ? 'bg-neutral-700 shadow-sm text-neutral-50' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Tutorial API</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-50">Hosted Pages</h2>
                <p className="text-neutral-400 text-sm mt-1">Manage your deployed HTML pages</p>
              </div>
              <button 
                onClick={() => setActiveTab('upload')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                New Page
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : pages.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
                <div className="bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
                  <FileCode2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-200 mb-1">No pages yet</h3>
                <p className="text-neutral-400 mb-6 max-w-sm mx-auto">Upload your first HTML file to get a public link instantly.</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Upload HTML
                </button>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-900/50 border-b border-neutral-800 text-neutral-400">
                      <tr>
                        <th className="px-6 py-3 font-medium">Page Name / ID</th>
                        <th className="px-6 py-3 font-medium">Created</th>
                        <th className="px-6 py-3 font-medium">Views</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-neutral-800/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <FileCode2 className="w-5 h-5 text-blue-400" />
                              <div className="flex flex-col">
                                <span className="font-medium text-neutral-200">{page.name || `Page ${page.id}`}</span>
                                <span className="text-xs font-mono text-neutral-500">{page.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-400">
                            {format(new Date(page.created_at), 'MMM d, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-neutral-400">
                              <Eye className="w-4 h-4 text-neutral-500" />
                              {page.views}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 transition-opacity">
                              <button 
                                onClick={() => copyToClipboard(page.id)}
                                className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-md transition-colors"
                                title="Copy Link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <a 
                                href={`/view/${page.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-md transition-colors"
                                title="Open Page"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button 
                                onClick={() => handleDownload(page.id)}
                                className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-md transition-colors"
                                title="Download HTML"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(page.id)}
                                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-900/30 rounded-md transition-colors"
                                title="Delete Page"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'upload' ? (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-50">Upload HTML</h2>
              <p className="text-neutral-400 text-sm mt-1">Choose a method to host your HTML content.</p>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Page Name (Optional)</label>
                  <input
                    type="text"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="e.g. My Awesome Landing Page"
                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Upload Method</label>
                  <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setUploadMethod('text')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${uploadMethod === 'text' ? 'bg-neutral-800 shadow-sm text-blue-400' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Paste HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('file')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${uploadMethod === 'file' ? 'bg-neutral-800 shadow-sm text-blue-400' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Expiration</label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="0">Never expires</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
              </div>

              {uploadMethod === 'text' ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <div className="bg-neutral-800/50 border-b border-neutral-800 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">
                      <FileCode2 className="w-4 h-4" />
                      index.html
                    </div>
                  </div>
                  <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    placeholder="<!DOCTYPE html>&#10;<html>&#10;  <head>&#10;    <title>My Page</title>&#10;  </head>&#10;  <body>&#10;    <h1>Hello World</h1>&#10;  </body>&#10;</html>"
                    className="w-full h-[400px] p-4 font-mono text-sm bg-transparent text-neutral-300 border-none focus:ring-0 resize-y placeholder:text-neutral-600"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="bg-neutral-900 border-2 border-dashed border-neutral-800 rounded-xl p-12 text-center hover:border-blue-500/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
                    <Upload className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-200 mb-1">
                    {selectedFile ? selectedFile.name : 'Choose an HTML file'}
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'Drag and drop or click to browse'}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-neutral-500">
                  Max size: 5MB. Scripts are allowed, use with caution.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || (uploadMethod === 'text' ? !htmlInput.trim() : !selectedFile)}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Publish Page
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
            
            <div className="mt-12 bg-blue-950/30 rounded-xl p-6 border border-blue-900/50">
              <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <Server className="w-4 h-4" />
                API Integration (FlowAI)
              </h3>
              <p className="text-sm text-blue-300/80 mb-4">
                You can also upload pages programmatically via API. 
                <br/><strong className="text-yellow-400">⚠️ IMPORTANTE:</strong> Ao enviar via código (fetch/axios) ou automação (n8n/Make), certifique-se de passar a variável que contém o HTML real, e não uma string literal com o nome da variável.
              </p>
              <div className="bg-black/50 border border-neutral-800 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-neutral-300 font-mono">
{`// Exemplo correto de envio via JavaScript (fetch):

// 1. Sua variável com o código HTML gerado pela IA
const respostaDaIA = "<!DOCTYPE html><html>...código gerado..."; 

// 2. Monte o payload passando a variável SEM aspas em volta
const payload = {
  "name": "My FlowAI Page",
  "html": respostaDaIA 
};

// 3. Faça o POST
fetch("/api/upload", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});`}
                </pre>
              </div>
            </div>

            <div className="mt-6 bg-purple-950/30 rounded-xl p-6 border border-purple-900/50">
              <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Prompt Mágico para Automação (n8n, Make, ChatGPT)
              </h3>
              <p className="text-sm text-purple-300/80 mb-4">
                Copie o prompt abaixo e cole na sua ferramenta de IA favorita. Ele ensina a IA a gerar o site e já devolver o link hospedado pronto para você clicar!
              </p>
              <div className="relative group">
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="absolute top-3 right-3 p-2 bg-purple-900/50 hover:bg-purple-800 rounded-md text-purple-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Copiar Prompt"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <pre className="bg-black/50 border border-neutral-800 rounded-lg p-4 overflow-x-auto text-xs text-neutral-300 font-mono whitespace-pre-wrap">
                  {automationPrompt}
                </pre>
              </div>
            </div>
          </div>
        ) : activeTab === 'tutorial' ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-50">Tutorial de Automação (API)</h2>
              <p className="text-neutral-400 text-sm mt-1">Aprenda a fazer o deploy automático de páginas usando n8n, Make ou ChatGPT.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  1. Como funciona a API?
                </h3>
                <p className="text-sm text-neutral-300 mb-4">
                  O FlowHost possui um endpoint (URL) que recebe código HTML e publica o site instantaneamente. Você só precisa fazer uma requisição HTTP POST.
                </p>
                <div className="bg-black/50 border border-neutral-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-neutral-300 font-mono">
{`POST /api/upload
Content-Type: application/json

{
  "name": "Meu Site Automático",
  "html": "<!DOCTYPE html><html>...</html>",
  "expiresInDays": "7" // Opcional
}`}
                  </pre>
                </div>
                <p className="text-xs text-neutral-500 mt-3">
                  A API retornará um JSON com a propriedade <code className="text-blue-400">url</code> contendo o link do site publicado.
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  2. Prompt Mágico para IAs
                </h3>
                <p className="text-sm text-neutral-300 mb-4">
                  Quer que o ChatGPT crie e publique o site para você? Copie o prompt abaixo e cole na sua IA favorita (que tenha acesso à internet/ações).
                </p>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={copyPrompt}
                    className="absolute top-2 right-2 p-2 bg-purple-900/50 hover:bg-purple-800 rounded-md text-purple-300 transition-colors"
                    title="Copiar Prompt"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <pre className="bg-black/50 border border-neutral-800 rounded-lg p-4 overflow-x-auto text-xs text-neutral-300 font-mono whitespace-pre-wrap h-48 overflow-y-auto">
                    {automationPrompt}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Exemplo Prático: Fluxo no n8n / Make</h3>
              <div className="space-y-4 text-sm text-neutral-300">
                <p>Para criar um fluxo perfeito de automação (ex: gerar site a partir de um formulário ou email), siga estes passos:</p>
                <ol className="list-decimal list-inside space-y-3 ml-2">
                  <li><strong>Gatilho (Trigger):</strong> Receba os dados (ex: Webhook, novo email, formulário preenchido).</li>
                  <li><strong>Geração (OpenAI Node):</strong> Envie os dados para o ChatGPT pedindo para gerar o código HTML completo.</li>
                  <li><strong>Deploy (HTTP Request Node):</strong>
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-neutral-400">
                      <li>Method: <code className="text-blue-400">POST</code></li>
                      <li>URL: <code className="text-blue-400">{typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.com'}/api/upload</code></li>
                      <li>Body Type: <code className="text-blue-400">JSON</code></li>
                      <li>Body: <code className="text-blue-400">{`{ "name": "Site Gerado", "html": "{{$json.html_gerado}}" }`}</code></li>
                    </ul>
                  </li>
                  <li><strong>Resultado:</strong> Pegue o campo <code className="text-blue-400">url</code> da resposta HTTP e envie por email ou WhatsApp para o seu cliente!</li>
                </ol>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer Credits */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-neutral-800 mt-auto">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <p className="text-sm text-neutral-400">
            Desenvolvido por <span className="font-semibold text-neutral-200">João Layon</span>, CEO da <span className="font-semibold text-blue-400">Ds Company</span>
          </p>
          <a 
            href="https://www.instagram.com/dscompany1_/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-pink-500 transition-colors"
          >
            <span className="font-medium">Siga no Instagram: @dscompany1_</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
