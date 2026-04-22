import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, AIMessage } from "@/lib/agent";
import { createSupabaseClient } from "@/lib/server/supabase";
import { InvestmentThesisRepository, CriteriaRepository } from "@/lib/repositories";
import type { DbClient } from "@/lib/repositories";
import { BaseMessage } from "@langchain/core/messages";
import { toUIMessageStream, toBaseMessages } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage } from "ai";

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

/**
 * Fetch active investment thesis and screening criteria to provide context.
 */
async function fetchContextData(db: DbClient): Promise<string> {
  try {
    const thesisRepo = new InvestmentThesisRepository(db);
    const criteriaRepo = new CriteriaRepository(db);
    const contextParts: string[] = [];

    const theses = await thesisRepo.findActiveList(3);
    if (theses.length > 0) {
      contextParts.push("## Current Investment Thesis\n");
      theses.forEach((thesis, i) => {
        contextParts.push(`### ${i + 1}. ${thesis.title}`);
        contextParts.push(thesis.content);
        contextParts.push("");
      });
    }

    const criteria = await criteriaRepo.findAll();
    if (criteria.length > 0) {
      contextParts.push("## Screening Criteria\n");
      contextParts.push("The following criteria are used to evaluate companies:\n");
      criteria.forEach((c, i) => {
        contextParts.push(`${i + 1}. **${c.name}**: ${c.prompt}`);
      });
      contextParts.push("");
    }

    if (contextParts.length > 0) {
      return `\n---\n**CONTEXT: Use the following investment thesis and screening criteria to inform your analysis:**\n\n${contextParts.join("\n")}\n---\n\n`;
    }

    return "";
  } catch (error) {
    console.error("Error fetching context data:", error);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const returnIntermediateSteps = body.show_intermediate_steps;

    const db = createSupabaseClient();
    const contextData = await fetchContextData(db);

    console.log(JSON.stringify(body.messages));

    const filteredMessages = (body.messages ?? []).filter(
      (message: { role: string }) =>
        message.role === "user" || message.role === "assistant",
    );

    const rawMessages: UIMessage[] = filteredMessages.map((msg: { role: string; parts?: { type: string }[]; content?: unknown }) => {
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts.filter((part: { type: string }) => part.type === "text");
        return { ...msg, parts: textParts };
      }
      return {
        ...msg,
        parts: msg.content
          ? [
              {
                type: "text",
                text:
                  typeof msg.content === "string"
                    ? msg.content
                    : JSON.stringify(msg.content),
              },
            ]
          : [],
      };
    });

    const messages: BaseMessage[] = await toBaseMessages(rawMessages);

    const agent = getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not available. Please ensure ANTHROPIC_API_KEY is set." },
        { status: 500 },
      );
    }

    if (!returnIntermediateSteps) {
      const eventStream = await agent.streamEvents(
        { messages, additionalSystemContext: contextData || undefined },
        { version: "v2", recursionLimit: 50 },
      );

      /**
       * Stream back all generated tokens and steps from their runs.
       * Using streamEvents v2 which is supported by @ai-sdk/langchain adapter
       */
      return createUIMessageStreamResponse({
        stream: toUIMessageStream(eventStream),
      });
    } else {
      const result = await agent.invoke(
        { messages, additionalSystemContext: contextData || undefined },
        { recursionLimit: 50 },
      );

      const validMessages = result.messages.map((m: BaseMessage | string) => {
        if (typeof m === "string") {
          return new AIMessage(m);
        }
        return m as BaseMessage;
      });

      /**
       * Return intermediate steps
       */
      return NextResponse.json(
        { messages: validMessages.map(convertLangChainMessageToVercelMessage) },
        { status: 200 },
      );
    }
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
