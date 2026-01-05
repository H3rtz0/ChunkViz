export type ChunkingStrategy = 'fixed' | 'recursive' | 'semantic' | 'markdown' | 'json';

export interface Chunk {
  id: string;
  content: string;
  index: number;
  length: number;
  tokenCount: number;
}

export type SemanticProvider = 'google' | 'deepseek' | 'aliyun' | 'custom';

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  separators: string[];
  // Semantic Config
  provider: SemanticProvider;
  apiKey: string;
  baseUrl: string;
  semanticModel: string;
}

export const DEFAULT_TEXT = `人工智能（Artificial Intelligence，缩写为AI）亦称智械、机器智能，指由人制造出来的机器所表现出来的智能。通常人工智能是指通过普通计算机程序来呈现人类智能的技术。该词也指出研究这样的智能系统是否能够实现，以及如何实现。同时，通过医学、神经科学、机器人学及统计学等的进步，常态预测则认为人类的很多职业也逐渐被其取代。

人工智能于一般教材中的定义领域是“智能主体（intelligent agent）的研究与设计”，智能主体指一个可以观察周遭环境并作出行动以达致目标的系统。这也是由人工智慧领域最主要的教科书编写者罗素（Stuart J. Russell）与诺德格（Peter Norvig）所定义。

人工智能的研究是高度技术性和专业的，各分支领域都是深入且各不相通的，因而涉及范围极广。人工智能的核心问题包括建构能够跟人类似甚至超卓的推理、知识、规划、学习、交流、感知、移物、使用工具和操控机械的能力等。通用人工智能（general intelligence）目前仍然是该领域的长远目标。目前弱人工智能已经有初步成果，甚至在一些特定领域，例如围棋、像棋、医学诊断与证券交易等等，其表现已远远超越人类。`;

export const PRESETS: Record<ChunkingStrategy, ChunkingConfig> = {
  fixed: {
    chunkSize: 200,
    chunkOverlap: 20,
    separators: [],
    provider: 'google',
    apiKey: '',
    baseUrl: '',
    semanticModel: '',
  },
  recursive: {
    chunkSize: 200,
    chunkOverlap: 20,
    separators: ["\n\n", "\n", "。", "！", "？", "；", " ", ""],
    provider: 'google',
    apiKey: '',
    baseUrl: '',
    semanticModel: '',
  },
  markdown: {
    chunkSize: 500,
    chunkOverlap: 50,
    separators: ["\n# ", "\n## ", "\n### ", "\n#### ", "\n- ", "\n\n", "\n"],
    provider: 'google',
    apiKey: '',
    baseUrl: '',
    semanticModel: '',
  },
  json: {
    chunkSize: 1000,
    chunkOverlap: 0,
    separators: [],
    provider: 'google',
    apiKey: '',
    baseUrl: '',
    semanticModel: '',
  },
  semantic: {
    chunkSize: 0,
    chunkOverlap: 0,
    separators: [],
    provider: 'google',
    apiKey: '',
    baseUrl: '',
    semanticModel: 'gemini-3-flash-preview',
  }
};