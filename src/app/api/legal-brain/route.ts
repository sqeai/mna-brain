import { NextRequest, NextResponse } from "next/server";
import { getLegalBrainGraph } from "@/lib/legal-brain";
import { BaseMessage } from "@langchain/core/messages";
import { toUIMessageStream, toBaseMessages } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { extractTextFromFile } from "@/lib/fileExtractor";

/**
 * Legal Brain Assistant API.
 * Accepts messages and optional attachedFile: { base64, fileName, mimeType }.
 * If attachedFile is provided, its text is extracted and prepended to the last user message.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const attachedFile = body.attachedFile as
      | { base64: string; fileName: string; mimeType: string }
      | undefined;

    let rawMessages: UIMessage[] = (body.messages ?? [])
      .filter((m: { role?: string }) => m.role === "user" || m.role === "assistant")
      .map((msg: { parts?: Array<{ type: string; text?: string }>; content?: string; role: string; id?: string }) => {
        if (msg.parts && Array.isArray(msg.parts)) {
          return { ...msg, parts: msg.parts.filter((p: { type: string }) => p.type === "text") };
        }
        return {
          ...msg,
          parts: msg.content
            ? [{ type: "text" as const, text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) }]
            : [],
        };
      });

    if (attachedFile?.base64 && attachedFile?.fileName) {
      try {
        const buffer = Buffer.from(attachedFile.base64, "base64");
        const mimeType = attachedFile.mimeType || "application/octet-stream";
        const extractedText = await extractTextFromFile(buffer, mimeType, attachedFile.fileName);
        const fileBlock = `\n\n---\n**[Attached document: ${attachedFile.fileName}]**\n\n${extractedText.slice(0, 120000)}\n---\n`;
        const lastUserIndex = rawMessages.map((m) => m.role).lastIndexOf("user");
        if (lastUserIndex !== -1) {
          const last = rawMessages[lastUserIndex];
          const textParts = (last.parts || []).filter((p: { type: string }) => p.type === "text");
          const currentText = textParts.map((p) => ("text" in p && typeof (p as { text?: string }).text === "string" ? (p as { text: string }).text : "")).join("");
          rawMessages = rawMessages.slice(0, lastUserIndex).concat(
            {
              ...last,
              parts: [{ type: "text" as const, text: currentText + fileBlock }],
            },
            rawMessages.slice(lastUserIndex + 1)
          );
        } else {
          rawMessages = [
            { id: "file-only", role: "user" as const, parts: [{ type: "text" as const, text: `User attached a document: ${attachedFile.fileName}.${fileBlock}` }] },
            ...rawMessages,
          ];
        }
      } catch (fileErr) {
        console.error("Legal Brain: file extraction failed", fileErr);
        return NextResponse.json(
          { error: `Failed to process attached file: ${(fileErr as Error).message}` },
          { status: 400 }
        );
      }
    }

    const messages: BaseMessage[] = await toBaseMessages(rawMessages);

    const agent = getLegalBrainGraph();
    if (!agent) {
      return NextResponse.json(
        { error: "Legal Brain is not available. Please ensure ANTHROPIC_API_KEY is set." },
        { status: 500 }
      );
    }

    const eventStream = await agent.streamEvents({ messages }, { recursionLimit: 50 });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(eventStream),
    });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number };
    return NextResponse.json(
      { error: err?.message ?? "Legal Brain request failed" },
      { status: err?.status ?? 500 }
    );
  }
}
