import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Visualizer } from './components/Visualizer';
import { Chunk, ChunkingConfig, ChunkingStrategy, DEFAULT_TEXT, PRESETS } from './types';
import { generateFixedSizeChunks, generateRecursiveChunks, generateMarkdownChunks, generateJsonChunks } from './services/chunkers';
import { generateSemanticChunks } from './services/gemini';
import { FileText, UploadCloud, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [inputText, setInputText] = useState(DEFAULT_TEXT);
  const [strategy, setStrategy] = useState<ChunkingStrategy>('fixed');
  const [config, setConfig] = useState<ChunkingConfig>(PRESETS.fixed);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input'); // For mobile views mainly
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update config when strategy changes
  useEffect(() => {
    setConfig(prev => ({
      ...PRESETS[strategy],
    }));
  }, [strategy]);

  const runChunking = useCallback(async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setActiveTab('output'); // Auto switch to view results

    try {
      let result: Chunk[] = [];
      
      // Artificial delay for algo chunking to show UI state clearly
      if (strategy !== 'semantic') {
         await new Promise(r => setTimeout(r, 400));
      }

      switch (strategy) {
        case 'fixed':
          result = generateFixedSizeChunks(inputText, config);
          break;
        case 'recursive':
          result = generateRecursiveChunks(inputText, config);
          break;
        case 'markdown':
          result = generateMarkdownChunks(inputText, config);
          break;
        case 'json':
          result = generateJsonChunks(inputText, config);
          break;
        case 'semantic':
          result = await generateSemanticChunks(inputText, config);
          break;
      }
      setChunks(result);
    } catch (error) {
      console.error("Chunking failed", error);
      if (error instanceof Error) {
         alert(error.message);
      } else {
         alert("切分失败。请查看控制台详情。");
      }
    } finally {
      setLoading(false);
    }
  }, [inputText, strategy, config]);

  // File Handling Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const readFile = (file: File) => {
    // Basic text file type check or extension check
    const validTypes = ['text/', 'application/json', 'application/javascript', 'application/xml'];
    const validExtensions = ['.md', '.txt', '.csv', '.json', '.js', '.ts', '.py', '.html', '.css', '.xml'];
    
    const isTextType = validTypes.some(type => file.type.startsWith(type));
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isTextType && !hasValidExt) {
        if (!confirm(`文件 "${file.name}" 可能不是纯文本文件。是否仍要尝试读取？`)) {
            return;
        }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
            setInputText(content);
        }
    };
    reader.onerror = () => alert("读取文件失败");
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
        readFile(file);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Settings */}
      <ControlPanel 
        strategy={strategy}
        setStrategy={setStrategy}
        config={config}
        setConfig={setConfig}
        onRun={runChunking}
        loading={loading}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header (Hidden on LG) */}
        <div className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
             <span className="font-bold text-slate-700">ChunkViz</span>
             <div className="flex gap-2">
               <button 
                 onClick={() => setActiveTab('input')}
                 className={`px-3 py-1 text-xs font-medium rounded-full ${activeTab === 'input' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}
               >
                 输入
               </button>
               <button 
                 onClick={() => setActiveTab('output')}
                 className={`px-3 py-1 text-xs font-medium rounded-full ${activeTab === 'output' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}
               >
                 结果
               </button>
             </div>
        </div>

        {/* Desktop Split View */}
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
          
          {/* Input Panel */}
          <div className={`flex-1 flex flex-col border-r border-slate-200 bg-white h-full transition-all duration-300 ${activeTab === 'input' ? 'block' : 'hidden lg:flex'}`}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 h-16">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <FileText className="w-4 h-4" />
                <h2>源文本</h2>
              </div>
              <div className="flex items-center gap-3">
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.md,.json,.csv,.xml,.js,.ts,.py,.html"
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    title="上传文本文件"
                 >
                    <UploadCloud className="w-3.5 h-3.5" />
                    上传文档
                 </button>
                 {inputText.length > 0 && (
                     <button 
                        onClick={() => {
                            if(confirm('确定要清空文本吗？')) setInputText('');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        title="清空"
                     >
                        <Trash2 className="w-3.5 h-3.5" />
                     </button>
                 )}
                 <span className="text-xs text-slate-400 font-mono border-l pl-3 ml-1">{inputText.length} 字符</span>
              </div>
            </div>
            
            <div 
                className="flex-1 relative group"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
              {/* Drag Overlay */}
              {isDragging && (
                  <div className="absolute inset-0 bg-indigo-50/90 z-10 flex flex-col items-center justify-center border-2 border-dashed border-indigo-400 m-2 rounded-lg pointer-events-none">
                      <UploadCloud className="w-12 h-12 text-indigo-500 mb-2" />
                      <p className="text-indigo-700 font-semibold">释放文件以加载文本</p>
                  </div>
              )}
              
              <textarea
                className="w-full h-full resize-none p-6 text-slate-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-50 leading-relaxed"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="在此粘贴文本，或点击上方按钮上传文档 (.md, .txt, .json)..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* Visualization Panel */}
          <div className={`flex-1 flex flex-col bg-slate-50/50 h-full transition-all duration-300 ${activeTab === 'output' ? 'block' : 'hidden lg:flex'}`}>
             <Visualizer chunks={chunks} loading={loading} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;