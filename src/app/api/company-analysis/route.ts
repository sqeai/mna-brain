/**
 * API Route for AI Company Card Analysis.
 * Generates a comprehensive company analysis using the LangGraph agent,
 * collecting data from the database, web search, Inven API, and files.
 * Results are cached in the company_analyses table.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, HumanMessage } from "@/lib/agent";
import { getToolDescriptions } from "@/lib/agent/tools";
import { createSupabaseClient } from "@/lib/server/supabase";
import { CompanyAnalysisRepository, CompanyRepository } from "@/lib/repositories";
import type { Tables } from "@/lib/repositories";
import { z } from "zod";

const CompanyAnalysisResultSchema = z.object({
  business_overview: z.string(),
  business_model_summary: z.string(),
  key_takeaways: z.string(),
  investment_highlights: z.string(),
  investment_risks: z.string(),
  diligence_priorities: z.string(),
  sources_used: z
    .array(
      z.object({
        type: z.string(),
        url: z.string().optional(),
        title: z.string().optional(),
      }),
    )
    .optional(),
});

type CompanyAnalysisResult = z.infer<typeof CompanyAnalysisResultSchema>;

const ANALYSIS_PROMPT_TEMPLATE = `You are a senior M&A analyst preparing a comprehensive Company Card for an acquisition target. Your job is to research the company thoroughly using ALL available tools, then produce a structured analysis.

## IMPORTANT: Use All Available Tools to Research

You have access to these tools — USE THEM ALL to gather comprehensive information:
{toolDescriptions}

**Research steps you MUST follow:**
1. Use \`get_company_details\` to retrieve internal database information about "{companyName}"
2. Use \`inven_paid_data_source_search\` to find the company on Inven, then \`inven_paid_data_source_enrichment\` for detailed data
3. Use \`web_search\` to research the company's website, products, market position, recent news, and competitive landscape (e.g., "{companyName} company overview products services", "{companyName} revenue market position competitors")
4. Use \`query_files\` to check if there are any internal files about this company
5. Use \`compare_with_past_acquisitions\` if relevant to check how it compares to past deals

## Company Context
{companyContext}

## Analysis Sections to Produce

Generate the following 6 sections. Each section must be **markdown-formatted** using bullet points (matching the style shown below). Be specific, data-driven, and concise.

### 1. Business Overview
Establish a factual baseline about the company:
- **Primary Products/Services**: What the company makes or provides
- **End Markets**: Which industries/verticals they serve
- **Customer Types**: OEMs, distributors, end consumers, B2B, B2G, etc.
- **Geographic Footprint**: HQ location, production facilities, key markets
- **Company Size**: Employee count, revenue scale if available

### 2. Business Model & Value Chain Summary
Explain how the company operates economically:
- **Core Focus**: What is the company's niche or specialization
- **Value Chain Position**: Where the company sits (upstream, midstream, downstream)
- **Revenue Model**: Recurring vs. project-based, contract vs. spot, subscription vs. one-time
- **Competitive Dimension**: What drives customer selection (price, quality, speed, IP, compliance)
- **Switching Costs**: How sticky are customer relationships

### 3. Key Takeaways
Surface the 3-5 most important implications from the analysis (synthesized insights):
- Each takeaway should be a bold header followed by a brief explanation
- Focus on what an M&A investment committee member needs to know
- Include both positive and cautionary observations

### 4. Investment Highlights
Identify upside drivers linked to the company's business model and positioning:
- **Market Position**: Competitive standing and market share
- **Differentiation**: Proprietary technology, IP, regulatory advantages
- **Strategic Fit**: Alignment with investment thesis and portfolio
- **Growth Vectors**: Organic growth opportunities, new markets, product expansion

### 5. Investment Risks
Identify risks inherent to the company's business model and value chain:
- **Customer Concentration**: Revenue dependency on top customers
- **Regulatory Exposure**: Compliance costs, policy changes
- **End-Market Cyclicality**: Vulnerability to economic cycles
- **Data Gaps**: Information that could not be verified or found

### 6. Diligence Priorities
Define the 3-7 most critical unknowns to resolve before advancing investment:
- Frame each as a specific question that due diligence should answer
- Prioritize items that could be deal-breakers
- Include financial, operational, legal, and commercial dimensions

## Response Format

Respond ONLY with a JSON object. Each section value should be a markdown string with bullet points.

\`\`\`json
{
  "business_overview": "- **Primary Products**: ...\\n- **End Markets**: ...\\n...",
  "business_model_summary": "- **Core Focus**: ...\\n- **Value Chain Position**: ...\\n...",
  "key_takeaways": "1. **Takeaway title** explanation...\\n2. ...\\n...",
  "investment_highlights": "- **Market Position**: ...\\n- **Differentiation**: ...\\n...",
  "investment_risks": "- **Customer Concentration**: ...\\n- **Regulatory Exposure**: ...\\n...",
  "diligence_priorities": "1. Question one?\\n2. Question two?\\n...",
  "sources_used": [{"type": "database"}, {"type": "web", "url": "https://...", "title": "..."}, {"type": "inven"}, {"type": "{source}"}]
}
\`\`\`

Include ONLY the sources you actually used in \`sources_used\`. Respond with the JSON object only, no additional text.`;

/**
 * GET: Fetch existing analysis for a company.
 */
export async function GET(request: NextRequest) {
  try {
    const companyId = new URL(request.url).searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing required query parameter: companyId" },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const analysisRepo = new CompanyAnalysisRepository(db);

    const data = await analysisRepo.findByCompanyId(companyId);

    if (!data) {
      return NextResponse.json(
        { error: "No analysis found for this company" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET company-analysis error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Generate (or return cached) company analysis.
 */
export async function POST(request: NextRequest) {
  const db = createSupabaseClient();
  const analysisRepo = new CompanyAnalysisRepository(db);
  const companyRepo = new CompanyRepository(db);
  let companyId: string | undefined;

  try {
    const body = await request.json();
    companyId = body.companyId;
    const source = body.source;

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing required field: companyId" },
        { status: 400 },
      );
    }

    const existing = await analysisRepo.findCompletedByCompanyId(companyId);
    if (existing) {
      return NextResponse.json(existing);
    }

    const company = await companyRepo.findById(companyId);

    await analysisRepo.upsertByCompanyId({
      company_id: companyId,
      status: "generating",
      error_message: null,
    });

    const agent = getAgentGraph();
    if (!agent) {
      await analysisRepo.updateByCompanyId(companyId, {
        status: "failed",
        error_message: "Agent not available. Check ANTHROPIC_API_KEY.",
      });
      return NextResponse.json(
        { error: "Agent not available. Please ensure ANTHROPIC_API_KEY is set." },
        { status: 500 },
      );
    }

    const companyContext = buildCompanyContext(company);
    const toolDescriptions = getToolDescriptions();

    const prompt = ANALYSIS_PROMPT_TEMPLATE.replace("{toolDescriptions}", toolDescriptions)
      .replace("{companyName}", company.target || "Unknown")
      .replace("{companyName}", company.target || "Unknown")
      .replace("{companyContext}", companyContext)
      .replace("{source}", source || "files");

    const result = await agent.invoke({ messages: [new HumanMessage(prompt)] });

    const messages = result.messages;
    const lastMsg = messages[messages.length - 1];
    const content = lastMsg
      ? typeof lastMsg.content === "string"
        ? lastMsg.content
        : JSON.stringify(lastMsg.content)
      : "";

    let analysisResult: CompanyAnalysisResult;
    try {
      analysisResult = CompanyAnalysisResultSchema.parse(JSON.parse(content));
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = CompanyAnalysisResultSchema.parse(JSON.parse(jsonMatch[0]));
        } catch {
          await analysisRepo.updateByCompanyId(companyId, {
            status: "failed",
            error_message: "Failed to parse AI response into structured format",
          });
          return NextResponse.json(
            { error: "Failed to parse AI response" },
            { status: 500 },
          );
        }
      } else {
        await analysisRepo.updateByCompanyId(companyId, {
          status: "failed",
          error_message: "AI response was not in expected JSON format",
        });
        return NextResponse.json(
          { error: "AI response was not in expected format" },
          { status: 500 },
        );
      }
    }

    const updated = await analysisRepo.updateByCompanyId(companyId, {
      status: "completed",
      business_overview: analysisResult.business_overview,
      business_model_summary: analysisResult.business_model_summary,
      key_takeaways: analysisResult.key_takeaways,
      investment_highlights: analysisResult.investment_highlights,
      investment_risks: analysisResult.investment_risks,
      diligence_priorities: analysisResult.diligence_priorities,
      sources: analysisResult.sources_used || [],
      error_message: null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST company-analysis error:", error);

    if (companyId) {
      try {
        await analysisRepo.updateByCompanyId(companyId, {
          status: "failed",
          error_message: (error as Error).message || "Unknown error",
        });
      } catch {
        // Ignore DB update error in error handler
      }
    }

    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Remove existing analysis to allow regeneration.
 */
export async function DELETE(request: NextRequest) {
  try {
    const companyId = new URL(request.url).searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Missing required query parameter: companyId" },
        { status: 400 },
      );
    }

    const db = createSupabaseClient();
    const analysisRepo = new CompanyAnalysisRepository(db);

    await analysisRepo.deleteByCompanyId(companyId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE company-analysis error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Build a human-readable context string from company data.
 */
function buildCompanyContext(company: Tables<'companies'>): string {
  const lines: string[] = [];

  lines.push(`**Company Name:** ${company.target || "Unknown"}`);

  if (company.segment) lines.push(`**Segment:** ${company.segment}`);
  if (company.geography) lines.push(`**Geography:** ${company.geography}`);
  if (company.company_focus) lines.push(`**Focus:** ${company.company_focus}`);
  if (company.ownership) lines.push(`**Ownership:** ${company.ownership}`);
  if (company.website) lines.push(`**Website:** ${company.website}`);
  if (company.comments) lines.push(`**Comments:** ${company.comments}`);

  const financials: string[] = [];
  if (company.revenue_2021_usd_mn != null) financials.push(`Revenue 2021: $${company.revenue_2021_usd_mn}M`);
  if (company.revenue_2022_usd_mn != null) financials.push(`Revenue 2022: $${company.revenue_2022_usd_mn}M`);
  if (company.revenue_2023_usd_mn != null) financials.push(`Revenue 2023: $${company.revenue_2023_usd_mn}M`);
  if (company.revenue_2024_usd_mn != null) financials.push(`Revenue 2024: $${company.revenue_2024_usd_mn}M`);
  if (company.ebitda_2021_usd_mn != null) financials.push(`EBITDA 2021: $${company.ebitda_2021_usd_mn}M`);
  if (company.ebitda_2022_usd_mn != null) financials.push(`EBITDA 2022: $${company.ebitda_2022_usd_mn}M`);
  if (company.ebitda_2023_usd_mn != null) financials.push(`EBITDA 2023: $${company.ebitda_2023_usd_mn}M`);
  if (company.ebitda_2024_usd_mn != null) financials.push(`EBITDA 2024: $${company.ebitda_2024_usd_mn}M`);
  if (company.ev_2024 != null) financials.push(`EV 2024: $${company.ev_2024}M`);

  const margins: string[] = [];
  if (company.ebitda_margin_2021 != null) margins.push(`Margin 2021: ${company.ebitda_margin_2021}%`);
  if (company.ebitda_margin_2022 != null) margins.push(`Margin 2022: ${company.ebitda_margin_2022}%`);
  if (company.ebitda_margin_2023 != null) margins.push(`Margin 2023: ${company.ebitda_margin_2023}%`);
  if (company.ebitda_margin_2024 != null) margins.push(`Margin 2024: ${company.ebitda_margin_2024}%`);

  if (financials.length > 0) {
    lines.push(`**Financials:**`);
    lines.push(financials.join(" | "));
  } else {
    lines.push(`**Financials:** No financial data available in database`);
  }

  if (margins.length > 0) {
    lines.push(`**EBITDA Margins:**`);
    lines.push(margins.join(" | "));
  }

  if (company.l1_screening_result) lines.push(`**L1 Screening Result:** ${company.l1_screening_result}`);
  if (company.l1_rationale) lines.push(`**L1 Rationale:** ${company.l1_rationale}`);

  return lines.join("\n");
}
