// Copilot AI types — aligned with batata-copilot crate models

export interface CopilotConfig {
  apiKey?: string | null
  model: string
  baseUrl?: string | null
  studioUrl?: string | null
  studioProject: string
}

export interface CopilotConfigUpdate {
  apiKey?: string
  model?: string
  baseUrl?: string
  studioUrl?: string
  studioProject?: string
}

// SSE streaming chunk types
export type StreamResponseType = 'THINKING' | 'TOOL_CALL' | 'CONTENT' | 'DONE'

export interface StreamChunk {
  type: StreamResponseType
  chunk: string
  done: boolean
  explanation?: string
}

// Skill optimization
export interface SkillOptimizationPayload {
  skill: {
    name: string
    description?: string
    skillMd?: string
    resource?: Record<string, SkillResourceItem>
  }
  optimizationGoal?: string
  targetFileName?: string
  selectedMcpTools?: SelectedMcpTool[]
  conversationHistory?: ConversationHistory
}

export interface SkillResourceItem {
  name: string
  type: string
  content?: string
  metadata?: Record<string, string>
}

export interface SelectedMcpTool {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

// Skill generation
export interface SkillGenerationPayload {
  backgroundInfo: string
  selectedMcpTools?: SelectedMcpTool[]
  conversationHistory?: ConversationHistory
}

// Prompt optimization
export interface PromptOptimizationPayload {
  prompt: string
  optimizationGoal?: string
}

// Prompt debug
export interface PromptDebugPayload {
  prompt: string
  userInput: string
}

// Conversation history for multi-turn
export interface ConversationHistory {
  messages: ConversationMessage[]
  context?: string
  title?: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Available LLM models
export const AVAILABLE_MODELS = [
  'qwen-turbo',
  'qwen-plus',
  'qwen-max',
  'qwen3-turbo',
  'qwen3-plus',
  'qwen3-max',
  'qwen3-7b-instruct',
  'qwen3-14b-instruct',
  'qwen3-32b-instruct',
  'qwen3-72b-instruct',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
  'deepseek-chat',
  'deepseek-reasoner',
] as const
