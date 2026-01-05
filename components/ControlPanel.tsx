import React, { useState, useEffect } from 'react';
import { ChunkingConfig, ChunkingStrategy, SemanticProvider } from '../types';
import { Settings, AlignJustify, Layers, BrainCircuit, Info, AlertCircle, FileJson, Hash, Server, Key, Globe, Box } from 'lucide-react';

interface ControlPanelProps {
  strategy: ChunkingStrategy;
  setStrategy: (s: ChunkingStrategy) => void;
  config: ChunkingConfig;
  setConfig: (c: ChunkingConfig) => void;
  onRun: () => void;
  loading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  strategy,
  setStrategy,
  config,
  setConfig,
  onRun,
  loading
}) => {
  const [separatorInput, setSeparatorInput] = useState(JSON.stringify(config.separators, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync local state when config changes externally (e.g. strategy switch)
  useEffect(() => {
      // Check if current input represents the same data to avoid overwriting user formatting while typing valid json
      let currentData = null;
      try {
          currentData = JSON.parse(separatorInput);
      } catch (e) {
          // ignore
      }
      
      // Deep compare
      if (JSON.stringify(currentData) !== JSON.stringify(config.separators)) {
          setSeparatorInput(JSON.stringify(config.separators, null, 2));
          setJsonError(null);
      }
  }, [config.separators]);

  const handleStrategyChange = (s: ChunkingStrategy) => {
    setStrategy(s);
  };

  const handleSeparatorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setSeparatorInput(val);
      
      try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
              setJsonError(null);
              setConfig({ ...config, separators: parsed as string[] });
          } else {
              setJsonError("格式错误: 必须是字符串数组");
          }
      } catch (err) {
          setJsonError("JSON 格式无效");
      }
  };

  const handleProviderChange = (provider: SemanticProvider) => {
      let newConfig = { ...config, provider };
      
      // Set defaults for providers
      switch (provider) {
          case 'google':
              newConfig.baseUrl = '';
              newConfig.semanticModel = 'gemini-3-flash-preview';
              break;
          case 'deepseek':
              newConfig.baseUrl = 'https://api.deepseek.com';
              newConfig.semanticModel = 'deepseek-chat';
              break;
          case 'aliyun':
              newConfig.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
              newConfig.semanticModel = 'qwen-plus';
              break;
          case 'custom':
              newConfig.baseUrl = '';
              newConfig.semanticModel = '';
              break;
      }
      setConfig(newConfig);
  };

  return (
    <div className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 flex flex-col h-full overflow-y-auto shrink-0">
      <div className="flex items-center gap-2 mb-8 text-slate-800">
        <Layers className="w-6 h-6 text-indigo-600" />
        <h1 className="text-xl font-bold tracking-tight">ChunkViz</h1>
      </div>

      <div className="space-y-8">
        {/* Strategy Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">切分策略</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleStrategyChange('fixed')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                strategy === 'fixed'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <AlignJustify className="w-4 h-4" />
              固定大小 (Fixed Size)
            </button>
            <button
              onClick={() => handleStrategyChange('recursive')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                strategy === 'recursive'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              递归字符 (Recursive)
            </button>
            <button
              onClick={() => handleStrategyChange('markdown')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                strategy === 'markdown'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Hash className="w-4 h-4" />
              Markdown (Header Split)
            </button>
            <button
              onClick={() => handleStrategyChange('json')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                strategy === 'json'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FileJson className="w-4 h-4" />
              JSON (Structure)
            </button>
            <button
              onClick={() => handleStrategyChange('semantic')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                strategy === 'semantic'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              语义切分 (LLM)
            </button>
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-6">
           <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">参数设置</label>
           </div>
           
           {strategy !== 'semantic' && (
             <>
               <div className="space-y-3">
                 <div className="flex justify-between">
                   <label className="text-sm font-medium text-slate-700">分块大小</label>
                   <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{config.chunkSize} 字符</span>
                 </div>
                 <input
                   type="range"
                   min="50"
                   max="2000"
                   step="10"
                   value={config.chunkSize}
                   onChange={(e) => setConfig({ ...config, chunkSize: parseInt(e.target.value) })}
                   className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
               </div>

               {strategy !== 'json' && (
                 <div className="space-y-3">
                   <div className="flex justify-between">
                      <label className="text-sm font-medium text-slate-700">重叠大小</label>
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{config.chunkOverlap} 字符</span>
                   </div>
                   <input
                     type="range"
                     min="0"
                     max={Math.max(0, config.chunkSize - 10)}
                     step="5"
                     value={config.chunkOverlap}
                     onChange={(e) => setConfig({ ...config, chunkOverlap: parseInt(e.target.value) })}
                     className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                   />
                   <p className="text-xs text-slate-400">重叠大小必须小于分块大小。</p>
                 </div>
               )}
             </>
           )}

           {(strategy === 'recursive' || strategy === 'markdown') && (
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">分隔符配置</label>
                    {jsonError && (
                        <div className="flex items-center gap-1 text-xs text-red-500 font-medium animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>{jsonError}</span>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <textarea 
                        value={separatorInput}
                        onChange={handleSeparatorChange}
                        className={`w-full h-32 p-3 text-xs font-mono bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
                            jsonError 
                            ? 'border-red-300 focus:ring-red-100' 
                            : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-300'
                        }`}
                        spellCheck={false}
                    />
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                   <p className="flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    请输入 JSON 字符串数组。系统将按顺序尝试使用这些分隔符进行切分。
                   </p>
                </div>
             </div>
           )}

           {strategy === 'json' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                <p className="flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>
                    JSON 模式会尝试解析输入文本。对于数组，将按元素分组；对于对象，将按键值对分组。
                    如果解析失败，将自动回退到普通文本递归切分。
                  </span>
                </p>
              </div>
           )}

           {strategy === 'semantic' && (
             <div className="space-y-4">
               {/* Provider Select */}
               <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-500"/>
                    模型服务商
                  </label>
                  <select 
                    value={config.provider}
                    onChange={(e) => handleProviderChange(e.target.value as SemanticProvider)}
                    className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  >
                    <option value="google">Google Gemini</option>
                    <option value="deepseek">DeepSeek (深度求索)</option>
                    <option value="aliyun">Tongyi Qianwen (通义千问)</option>
                    <option value="custom">Custom (自定义 OpenAI)</option>
                  </select>
               </div>

               {/* API Key */}
               <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-500"/>
                    API Key
                  </label>
                  <input 
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder={config.provider === 'google' ? "留空则使用默认配置(如已设置)" : "sk-..."}
                    className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400">密钥仅存储在本地浏览器内存中，刷新后丢失。</p>
               </div>

               {/* Model Name */}
               <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Box className="w-4 h-4 text-slate-500"/>
                    模型名称
                  </label>
                  <input 
                    type="text"
                    value={config.semanticModel}
                    onChange={(e) => setConfig({ ...config, semanticModel: e.target.value })}
                    className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-mono"
                  />
               </div>

               {/* Base URL (Hidden for Google unless custom?) Google uses SDK, so no Base URL field usually needed for default.
                   But for OpenAI compatible, we need it. */}
               {config.provider !== 'google' && (
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500"/>
                      API 地址 (Base URL)
                    </label>
                    <input 
                      type="text"
                      value={config.baseUrl}
                      onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                      placeholder="https://api.example.com/v1"
                      className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-mono"
                    />
                 </div>
               )}

               <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800">
                  <p className="opacity-90 leading-relaxed">
                    AI 将根据语义连贯性分析文本进行切分。这通常比基于规则的切分更准确，但速度较慢且需要消耗 Token。
                  </p>
               </div>
             </div>
           )}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <button
          onClick={onRun}
          disabled={loading || !!jsonError}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
            loading || !!jsonError
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </>
          ) : (
            '开始切分'
          )}
        </button>
      </div>
    </div>
  );
};