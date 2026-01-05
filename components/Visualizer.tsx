import React, { useState } from 'react';
import { Chunk } from '../types';
import { Copy, Check, BarChart3, List, Grid, Coins } from 'lucide-react';

interface VisualizerProps {
  chunks: Chunk[];
  loading: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ chunks, loading }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Stats
  const avgSize = chunks.length > 0 ? Math.round(chunks.reduce((acc, c) => acc + c.length, 0) / chunks.length) : 0;
  const totalTokens = chunks.length > 0 ? chunks.reduce((acc, c) => acc + (c.tokenCount || 0), 0) : 0;
  
  // Size range
  const minSize = chunks.length > 0 ? Math.min(...chunks.map(c => c.length)) : 0;
  const maxSize = chunks.length > 0 ? Math.max(...chunks.map(c => c.length)) : 0;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Pastel colors for chunks to differentiate them visually
  const colors = [
    'bg-blue-50 border-blue-200 text-blue-900',
    'bg-green-50 border-green-200 text-green-900',
    'bg-purple-50 border-purple-200 text-purple-900',
    'bg-orange-50 border-orange-200 text-orange-900',
    'bg-pink-50 border-pink-200 text-pink-900',
    'bg-cyan-50 border-cyan-200 text-cyan-900',
  ];

  if (chunks.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-lg font-medium">暂无切分结果</p>
        <p className="text-sm">输入文本并点击“开始切分”以查看结果。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header / Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm gap-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
           <div>
             <span className="block text-xs text-slate-500 font-semibold uppercase">切分数量</span>
             <span className="font-mono text-lg font-bold text-slate-800">{chunks.length}</span>
           </div>
           <div className="hidden sm:block w-px h-8 bg-slate-100"></div>
           <div>
             <span className="block text-xs text-slate-500 font-semibold uppercase">平均字符</span>
             <span className="font-mono text-lg font-bold text-slate-800">{avgSize}</span>
           </div>
           <div className="hidden sm:block w-px h-8 bg-slate-100"></div>
           <div>
             <span className="block text-xs text-slate-500 font-semibold uppercase">总 Token (估算)</span>
             <span className="font-mono text-lg font-bold text-indigo-600 flex items-center gap-1">
                {totalTokens}
             </span>
           </div>
           <div className="hidden lg:block w-px h-8 bg-slate-100"></div>
           <div className="hidden lg:block">
             <span className="block text-xs text-slate-500 font-semibold uppercase">长度范围</span>
             <span className="font-mono text-sm font-bold text-slate-800">{minSize} - {maxSize} <span className="text-xs font-normal text-slate-400">字符</span></span>
           </div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="列表视图"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="网格视图"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {loading ? (
             <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-slate-200 rounded-xl w-full"></div>
                ))}
             </div>
        ) : (
          <div className={`gap-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'flex flex-col'}`}>
            {chunks.map((chunk, i) => (
              <div 
                key={chunk.id} 
                className={`relative group rounded-xl border p-4 transition-all hover:shadow-md ${colors[i % colors.length]}`}
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-3">
                     <span className="px-2 py-0.5 bg-white/50 rounded-full text-xs font-bold border border-black/5">#{chunk.index + 1}</span>
                     <div className="flex items-center gap-2 text-xs font-mono opacity-60">
                         <span>{chunk.length} 字符</span>
                         <span>•</span>
                         <span className="flex items-center gap-0.5">
                            <Coins className="w-3 h-3" />
                            {chunk.tokenCount} Token
                         </span>
                     </div>
                   </div>
                   <button 
                     onClick={() => handleCopy(chunk.content, chunk.id)}
                     className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/50 rounded-md text-inherit"
                   >
                     {copiedId === chunk.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono break-words">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};