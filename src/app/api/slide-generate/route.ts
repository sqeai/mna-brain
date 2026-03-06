import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SLIDE_SYSTEM_PROMPT = `You are an expert M&A presentation designer. You generate pure HTML slides for investment presentations.

## Rules
- Output ONLY the HTML content for the slide body. No <html>, <head>, <body>, or <style> tags.
- The slide has a fixed container of 1120px × 630px (16:9 ratio). Design within these bounds.
- Use inline styles only. No external CSS or class-based styling.
- Use a clean, professional M&A / consulting style: dark navy headers, clean tables, subtle borders, professional color palette.
- Color palette: Navy (#1e3a5f), Dark Blue (#2563eb), Teal (#0d9488), White (#fff), Light Gray (#f8fafc), Slate (#475569).
- Use boxes with colored headers, tables, bullet points, and key metrics prominently displayed.
- Keep text concise and data-dense. This is for investment professionals.
- Use font-family: 'Inter', system-ui, sans-serif throughout.
- Make the slide visually rich: use colored boxes, metric callouts, mini tables, and structured layouts.
- For diagrams/arrows, use HTML/CSS (div borders, arrows via CSS triangles, flexbox layouts). No SVG or images.
- Fill the entire slide space efficiently. No large empty areas.
- All text should be readable (minimum 10px font size, prefer 11-13px for body text).
- Headers should be 14-16px, slide title 18-22px.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, currentHtml, companyContext, slideTitle } = body;

    if (!instruction) {
      return NextResponse.json(
        { error: "Missing required field: instruction" },
        { status: 400 }
      );
    }

    let prompt = "";

    if (currentHtml) {
      prompt = `Here is the current HTML content of a slide titled "${slideTitle || "Untitled"}":

\`\`\`html
${currentHtml}
\`\`\`

The user wants to modify this slide with the following instruction:
"${instruction}"

${companyContext ? `\n## Company Context\n${companyContext}\n` : ""}

Generate the updated HTML for this slide. Output ONLY the HTML, nothing else.`;
    } else {
      prompt = `Generate an HTML slide titled "${slideTitle || instruction}" for an M&A investment presentation.

The user's instruction: "${instruction}"

${companyContext ? `\n## Company Context\n${companyContext}\n` : ""}

Generate the HTML content for this slide. Output ONLY the HTML, nothing else.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SLIDE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    let html = content.type === "text" ? content.text : "";

    const htmlMatch = html.match(/```html\s*([\s\S]*?)```/);
    if (htmlMatch) {
      html = htmlMatch[1].trim();
    } else {
      html = html.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error("POST slide-generate error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
