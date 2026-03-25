import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { Copy, ExternalLink, Trash2, Upload, FileCode2, Eye, LayoutDashboard, Server, Download } from 'lucide-react';

interface Page {
  id: string;
  created_at: string;
  expires_at: string | null;
  views: number;
}

export default function App() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [htmlInput, setHtmlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload'>('dashboard');
  const [expiresInDays, setExpiresInDays] = useState('0');
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
            expiresInDays: expiresInDays !== '0' ? expiresInDays : undefined
          }),
        });
      } else {
        const formData = new FormData();
        if (selectedFile) formData.append('file', selectedFile);
        if (expiresInDays !== '0') formData.append('expiresInDays', expiresInDays);
        
        res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
      }
      
      const data = await res.json();
      if (data.success) {
        toast.success('Page uploaded successfully!');
        setHtmlInput('');
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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Server className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FlowHost</h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Hosted Pages</h2>
                <p className="text-neutral-500 text-sm mt-1">Manage your deployed HTML pages</p>
              </div>
              <button 
                onClick={() => setActiveTab('upload')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                New Page
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pages.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
                <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCode2 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-1">No pages yet</h3>
                <p className="text-neutral-500 mb-6 max-w-sm mx-auto">Upload your first HTML file to get a public link instantly.</p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Upload HTML
                </button>
              </div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">Page ID</th>
                        <th className="px-6 py-3 font-medium">Created</th>
                        <th className="px-6 py-3 font-medium">Views</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {pages.map((page) => (
                        <tr key={page.id} className="hover:bg-neutral-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileCode2 className="w-4 h-4 text-blue-500" />
                              <span className="font-mono font-medium text-neutral-900">{page.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-500">
                            {format(new Date(page.created_at), 'MMM d, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-neutral-600">
                              <Eye className="w-4 h-4 text-neutral-400" />
                              {page.views}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => copyToClipboard(page.id)}
                                className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Copy Link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <a 
                                href={`/view/${page.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Open Page"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button 
                                onClick={() => handleDownload(page.id)}
                                className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Download HTML"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(page.id)}
                                className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Upload HTML</h2>
              <p className="text-neutral-500 text-sm mt-1">Choose a method to host your HTML content.</p>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Upload Method</label>
                  <div className="flex bg-neutral-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setUploadMethod('text')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${uploadMethod === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      Paste HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('file')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${uploadMethod === 'file' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Expiration</label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="0">Never expires</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
              </div>

              {uploadMethod === 'text' ? (
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                      <FileCode2 className="w-4 h-4" />
                      index.html
                    </div>
                  </div>
                  <textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    placeholder="<!DOCTYPE html>&#10;<html>&#10;  <head>&#10;    <title>My Page</title>&#10;  </head>&#10;  <body>&#10;    <h1>Hello World</h1>&#10;  </body>&#10;</html>"
                    className="w-full h-[400px] p-4 font-mono text-sm bg-transparent border-none focus:ring-0 resize-y"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-neutral-200 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">
                    {selectedFile ? selectedFile.name : 'Choose an HTML file'}
                  </h3>
                  <p className="text-neutral-500 text-sm">
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
                    className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || (uploadMethod === 'text' ? !htmlInput.trim() : !selectedFile)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
            
            <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Server className="w-4 h-4" />
                API Integration (FlowAI)
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                You can also upload pages programmatically via API:
              </p>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-slate-300 font-mono">
{`POST /api/upload
Content-Type: application/json

{
  "html": "<html><body><h1>Hello from FlowAI</h1></body></html>"
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
