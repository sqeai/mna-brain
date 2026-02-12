/**
 * Legal Brain Assistant: document analysis with web search, Akta cross-check, and company details.
 */
import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "langchain";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { legalBrainTools } from "./tools";
import { logger } from "@/lib/agent/logger";

const SYSTEM_PROMPT = `You are the **Legal Brain Assistant**, a specialist that helps users analyze documents and answer legal and deal-related questions.

You have access to exactly three tools:

1. **web_search** – Search the web for legal, regulatory, market, or company information. Use for regulations, company news, public records, or anything not in internal data.
2. **akta_cross_checker** – Cross-check document content (e.g. from an Akta, deed, or contract) against internal company data. Use when the user uploads or pastes a document and wants it verified against known company information.
3. **get_company_details** – Get detailed information about a specific company from the internal database (name, segment, geography, financials, pipeline stage).

## How to help

- **Document analysis:** When the user attaches or pastes a document, summarize it and use **akta_cross_checker** (and optionally **get_company_details** or **web_search**) to verify facts or cross-check against internal data.
- **Company lookup:** Use **get_company_details** for a company name; if nothing is found or data is incomplete, use **web_search** to supplement.
- **Legal / regulatory / market questions:** Use **web_search** for current rules, benchmarks, or public information.
- **Cross-checking Aktas or contracts:** Use **akta_cross_checker** with the document text/summary and, if relevant, the company name from the document.

## Thinking and response

- When you begin your internal reasoning, output exactly: \`<!-- THINKING_START -->\` on its own line, then write your reasoning.
- When you finish reasoning and are about to give the final answer, output exactly: \`<!-- THINKING_END -->\` on its own line, then provide your response.
- Be concise but thorough. For cross-checks, clearly state what matches and what does not.

## Important

- If the user provides a long document, use the most relevant excerpts for **akta_cross_checker** (you may truncate to the most relevant portion).
- Always prefer **get_company_details** first for company-specific data, then **web_search** if needed.
- For document-heavy questions, combine **akta_cross_checker** with **get_company_details** or **web_search** as appropriate.`;

export interface LegalBrainAgentConfig {
  apiKey: string;
}

export interface LegalBrainInvokeOptions {
  messages: BaseMessage[];
  additionalSystemContext?: string;
}

export interface LegalBrainInvokeConfig {
  recursionLimit?: number;
}

export interface LegalBrainInvokeResult {
  messages: BaseMessage[];
}

function createLegalBrainAgent(config: LegalBrainAgentConfig, additionalSystemContext?: string) {
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    anthropicApiKey: config.apiKey,
    temperature: 0,
  });

  const fullSystemPrompt = additionalSystemContext
    ? `${SYSTEM_PROMPT}\n\n---\n\n## Additional context\n\n${additionalSystemContext}`
    : SYSTEM_PROMPT;

  return createAgent({
    model: llm,
    tools: legalBrainTools,
    systemPrompt: fullSystemPrompt,
  });
}

export class LegalBrainAgentGraph {
  private config: LegalBrainAgentConfig;
  private defaultAgent: ReturnType<typeof createLegalBrainAgent>;

  constructor(config: LegalBrainAgentConfig) {
    this.config = config;
    this.defaultAgent = createLegalBrainAgent(config);
  }

  private getAgent(additionalSystemContext?: string): ReturnType<typeof createLegalBrainAgent> {
    if (!additionalSystemContext) return this.defaultAgent;
    return createLegalBrainAgent(this.config, additionalSystemContext);
  }

  async invoke(
    inputs: LegalBrainInvokeOptions,
    invConfig?: LegalBrainInvokeConfig
  ): Promise<LegalBrainInvokeResult> {
    logger.debug(`Legal Brain: sending ${inputs.messages.length} message(s)`);
    try {
      const agent = this.getAgent(inputs.additionalSystemContext);
      const result = await agent.invoke({ messages: inputs.messages } as Parameters<typeof agent.invoke>[0], invConfig);
      if (result && typeof result === "object" && "messages" in result) {
        return { messages: result.messages as BaseMessage[] };
      }
      return { messages: [new AIMessage(JSON.stringify(result))] };
    } catch (error) {
      logger.error(`Legal Brain invocation failed: ${(error as Error).message}`);
      return {
        messages: [new AIMessage(`Error: ${(error as Error).message}`)],
      };
    }
  }

  async streamEvents(inputs: LegalBrainInvokeOptions, config?: { recursionLimit?: number }) {
    const agent = this.getAgent(inputs.additionalSystemContext);
    return agent.streamEvents(
      { messages: inputs.messages } as Parameters<typeof agent.streamEvents>[0],
      { version: "v2" as const, recursionLimit: config?.recursionLimit ?? 50 }
    );
  }
}

let legalBrainGraph: LegalBrainAgentGraph | null = null;

export function getLegalBrainGraph(): LegalBrainAgentGraph | null {
  if (legalBrainGraph) return legalBrainGraph;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.error("ANTHROPIC_API_KEY is required for Legal Brain");
    return null;
  }
  try {
    legalBrainGraph = new LegalBrainAgentGraph({ apiKey });
    return legalBrainGraph;
  } catch (error) {
    logger.error(`Failed to create Legal Brain agent: ${(error as Error).message}`);
    return null;
  }
}

export function resetLegalBrainGraph(): void {
  legalBrainGraph = null;
}
