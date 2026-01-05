import { GoogleGenAI, Type } from "@google/genai";
import { Chunk, ChunkingConfig } from '../types';
import { estimateTokenCount } from './chunkers';

export const generateSemanticChunks = async (text: string, config: ChunkingConfig): Promise<Chunk[]> => {
  const { provider, apiKey, baseUrl, semanticModel } = config;

  // Common prompt construction
  // Using a very strict prompt for raw text or JSON parsing
  const systemPrompt = `You are a helpful assistant that splits text into semantically meaningful chunks. 
  Each chunk should represent a coherent thought, topic, or paragraph group.
  Do not change the text content. Just split it.
  RETURN ONLY A RAW JSON ARRAY OF STRINGS. NO MARKDOWN. NO CODE BLOCKS.`;

  const userPrompt = `Text to split:
    """
    ${text}
    """`;

  let rawChunks: string[] = [];

  try {
    if (provider === 'google') {
        const key = apiKey || process.env.API_KEY;
        if (!key) throw new Error("Google API Key is missing. Please enter it in settings or check environment variables.");

        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
          model: semanticModel || 'gemini-3-flash-preview',
          contents: userPrompt, // For Gemini, we can put system instruction in config, but prompt engineering usually works well directly too for simple tasks
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              }
            }
          }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("No response from Gemini");
        rawChunks = JSON.parse(jsonText);

    } else {
        // OpenAI Compatible Providers (DeepSeek, Aliyun, Custom)
        if (!apiKey) throw new Error("API Key is required for this provider.");
        if (!baseUrl) throw new Error("Base URL is required for this provider.");
        if (!semanticModel) throw new Error("Model Name is required.");

        // Clean Base URL (remove trailing slash)
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        const url = `${cleanBaseUrl}/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: semanticModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                // Not all providers support response_format: { type: "json_object" }, so we rely on prompt engineering
                // DeepSeek supports strict JSON in newer models, but prompt is safer for compatibility
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Provider API Error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("Empty response from provider.");

        // Attempt to extract JSON if wrapped in markdown
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        rawChunks = JSON.parse(jsonStr);
    }

    return rawChunks.map((content, index) => ({
      id: `sem-chunk-${index}-${Date.now()}`,
      index,
      content,
      length: content.length,
      tokenCount: estimateTokenCount(content),
    }));

  } catch (error) {
    console.error("Semantic Chunking Error:", error);
    if (error instanceof Error) {
        throw new Error(`切分失败: ${error.message}`);
    }
    throw error;
  }
};