import { Chunk, ChunkingConfig } from '../types';

export const estimateTokenCount = (text: string): number => {
  // Simple heuristic for UI visualization:
  // CJK characters ~ 1 token
  // Non-CJK characters ~ 0.25 tokens (4 chars per token)
  let cjkCount = 0;
  const cjkRegex = /[\u4e00-\u9fa5\u3040-\u30ff\u3400-\u4dbf\uf900-\ufaff\uff66-\uff9f]/g;
  const matches = text.match(cjkRegex);
  cjkCount = matches ? matches.length : 0;
  
  const otherCount = Math.max(0, text.length - cjkCount);
  
  return cjkCount + Math.ceil(otherCount / 4);
};

export const generateFixedSizeChunks = (text: string, config: ChunkingConfig): Chunk[] => {
  const { chunkSize, chunkOverlap } = config;
  if (chunkSize <= 0) return [];
  
  const chunks: Chunk[] = [];
  let start = 0;
  
  // Prevent infinite loops if overlap >= size
  const effectiveOverlap = Math.min(chunkOverlap, chunkSize - 1);
  const step = chunkSize - effectiveOverlap;

  let index = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const content = text.slice(start, end);
    
    chunks.push({
      id: `chunk-${index}-${Date.now()}`,
      index,
      content,
      length: content.length,
      tokenCount: estimateTokenCount(content),
    });

    start += step;
    index++;
  }

  return chunks;
};

export const generateRecursiveChunks = (text: string, config: ChunkingConfig): Chunk[] => {
  const { chunkSize, chunkOverlap, separators } = config;
  const finalChunks: string[] = [];
  
  // Helper to split text
  const splitText = (currentText: string, separatorsList: string[]) => {
    const finalChunksLocal: string[] = [];
    let goodSplits: string[] = [];
    
    // Find the best separator
    let separator = separatorsList[0] || '';
    let nextSeparators = separatorsList.slice(1);
    
    // If no separators left, we just hard split by characters if needed, or return as is
    if (separatorsList.length === 0) {
        // Hard limit split if still too big
        if (currentText.length > chunkSize) {
            // Simple character slice if we ran out of separators
            let start = 0;
            const effectiveOverlap = Math.min(chunkOverlap, chunkSize - 1);
            const step = chunkSize - effectiveOverlap;
            while(start < currentText.length) {
                finalChunksLocal.push(currentText.slice(start, Math.min(start + chunkSize, currentText.length)));
                start += step;
            }
            return finalChunksLocal;
        } else {
            return [currentText];
        }
    }

    // Try to split
    // Escape regex special characters for split
    const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = currentText.split(new RegExp(`(${escapedSeparator})`));
    
    // Re-assemble into good chunks
    let currentChunk = "";
    
    for (let i = 0; i < parts.length; i++) {
       const part = parts[i];
       
       if (currentChunk.length + part.length > chunkSize) {
          if (currentChunk.length > 0) {
             // If current chunk is already big, push it
             if (currentChunk.length <= chunkSize) {
                 goodSplits.push(currentChunk);
                 currentChunk = "";
             } else {
                 // If the single chunk itself was too big, we need to recurse on it
                 const subChunks = splitText(currentChunk, nextSeparators);
                 goodSplits.push(...subChunks);
                 currentChunk = "";
             }
          }
       }
       currentChunk += part;
    }
    
    if (currentChunk.length > 0) {
        if (currentChunk.length <= chunkSize) {
             goodSplits.push(currentChunk);
        } else {
             const subChunks = splitText(currentChunk, nextSeparators);
             goodSplits.push(...subChunks);
        }
    }

    return goodSplits;
  };

  const rawSegments: string[] = [];
  
  const recurse = (txt: string, seps: string[]) => {
      if (txt.length <= chunkSize) {
          rawSegments.push(txt);
          return;
      }
      
      if (seps.length === 0) {
           // Hard split
           for (let i = 0; i < txt.length; i += (chunkSize - chunkOverlap)) {
               rawSegments.push(txt.slice(i, i + chunkSize));
           }
           return;
      }
      
      const sep = seps[0];
      const nextSeps = seps.slice(1);
      
      if (txt.includes(sep)) {
          const parts = txt.split(sep);
          parts.forEach((part, idx) => {
             // Re-add separator if not last
             let partWithSep = part;
             if (idx < parts.length - 1) partWithSep += sep;
             recurse(partWithSep, nextSeps);
          });
      } else {
          recurse(txt, nextSeps);
      }
  };

  recurse(text, separators);

  let chunks: string[] = [];
  let currentUnit = "";
  for (const segment of rawSegments) {
      if (currentUnit.length + segment.length > chunkSize) {
          if (currentUnit.length > 0) {
              chunks.push(currentUnit);
              const overlapStart = Math.max(0, currentUnit.length - chunkOverlap);
              currentUnit = currentUnit.slice(overlapStart);
          }
      }
      currentUnit += segment;
  }
  if (currentUnit.length > 0) chunks.push(currentUnit);
  
  return chunks.filter(c => c.trim().length > 0).map((c, i) => ({
      id: `rec-chunk-${i}-${Date.now()}`,
      index: i,
      content: c,
      length: c.length,
      tokenCount: estimateTokenCount(c),
  }));
};

export const generateMarkdownChunks = (text: string, config: ChunkingConfig): Chunk[] => {
  // Markdown essentially uses recursive logic but with specific separators passed via config
  return generateRecursiveChunks(text, config);
};

export const generateJsonChunks = (text: string, config: ChunkingConfig): Chunk[] => {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.warn("Invalid JSON for JSON chunker, falling back to recursive text splitting.");
    return generateRecursiveChunks(text, config);
  }

  const chunks: Chunk[] = [];
  let index = 0;

  const addChunk = (content: string) => {
      chunks.push({
          id: `json-chunk-${index}-${Date.now()}`,
          index: index++,
          content,
          length: content.length,
          tokenCount: estimateTokenCount(content),
      });
  };

  const processValue = (value: any) => {
      const jsonStr = JSON.stringify(value, null, 2);
      if (jsonStr.length <= config.chunkSize) {
          addChunk(jsonStr);
          return;
      }
      
      // If it's a large array, split it by items
      if (Array.isArray(value)) {
          let currentBatch: any[] = [];
          let currentSize = 0;
          
          for (const item of value) {
              const itemStr = JSON.stringify(item, null, 2);
              // +2 accounts for comma and formatting overhead roughly
              if (currentSize + itemStr.length + 2 > config.chunkSize && currentBatch.length > 0) {
                  addChunk(JSON.stringify(currentBatch, null, 2));
                  currentBatch = [];
                  currentSize = 0;
              }
              currentBatch.push(item);
              currentSize += itemStr.length + 2;
          }
          if (currentBatch.length > 0) {
               addChunk(JSON.stringify(currentBatch, null, 2));
          }
          return;
      }
      
      // If it's an object, split by keys
      if (typeof value === 'object' && value !== null) {
          let currentObj: Record<string, any> = {};
          let currentSize = 2; // {}
          
          for (const [k, v] of Object.entries(value)) {
               const propStr = `"${k}": ${JSON.stringify(v, null, 2)}`;
               if (currentSize + propStr.length + 2 > config.chunkSize && Object.keys(currentObj).length > 0) {
                   addChunk(JSON.stringify(currentObj, null, 2));
                   currentObj = {};
                   currentSize = 2;
               }
               currentObj[k] = v;
               currentSize += propStr.length + 2;
          }
          if (Object.keys(currentObj).length > 0) {
              addChunk(JSON.stringify(currentObj, null, 2));
          }
          return;
      }
      
      // Fallback for massive strings or primitives: use recursive text splitter on the string representation
      // We essentially treat the long JSON string as text here
      const recursiveChunks = generateRecursiveChunks(jsonStr, config);
      recursiveChunks.forEach(c => addChunk(c.content));
  };

  processValue(data);
  return chunks;
};