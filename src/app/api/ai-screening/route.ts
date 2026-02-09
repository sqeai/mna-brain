/**
 * API Route for AI Screening.
 * Evaluates a single company against a single criteria using the LangGraph agent.
 * Returns structured result (pass/fail/inconclusive/error) and remarks.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgentGraph, HumanMessage } from "@/lib/agent";
import { getToolDescriptions } from "@/lib/agent/tools";
import { z } from "zod";

// Schema for the screening result
const ScreeningResultSchema = z.object({
  result: z.enum(["pass", "fail", "inconclusive", "error"]),
  remarks: z.string(),
});

type ScreeningResult = z.infer<typeof ScreeningResultSchema>;

interface CompanyData {
  id: string;
  name: string;
  segment?: string | null;
  geography?: string | null;
  revenue_2022_usd_mn?: number | null;
  revenue_2023_usd_mn?: number | null;
  revenue_2024_usd_mn?: number | null;
  ebitda_2022_usd_mn?: number | null;
  ebitda_2023_usd_mn?: number | null;
  ebitda_2024_usd_mn?: number | null;
  ev_2024?: number | null;
  company_focus?: string | null;
  ownership?: string | null;
  website?: string | null;
}

interface ScreeningRequest {
  companyId: string;
  criteriaId: string;
  criteriaPrompt: string;
  company: CompanyData;
}

const SCREENING_PROMPT_TEMPLATE = `You are an M&A screening analyst. Your task is to evaluate whether a company passes or fails a specific screening criterion.

## IMPORTANT: Use All Available Tools

You have access to these tools - USE THEM to gather more information:
{toolDescriptions}

**Before returning "inconclusive" due to missing data, ALWAYS try these steps:**
1. If financial data is missing, use web_search to find it (e.g., "Company Name revenue EBITDA financials 2024")
2. If industry context is needed, use web_search for benchmarks (e.g., "Industry average EBITDA margin")
3. If criteria requires specific company info not provided, search for it
4. If you need to compare with past deals, use query_past_acquisitions or compare_with_past_acquisitions

## Company Information Provided
{companyContext}

## Screening Criterion
{criteriaPrompt}

## Your Task
1. First, review the company information provided above
2. If ANY information needed for the criterion is missing, use the appropriate tool to find it
3. Evaluate whether the company passes or fails the criterion
4. Return your decision as JSON

## Response Format
Respond ONLY with a JSON object containing:
- "result": one of "pass", "fail", "inconclusive", or "error"
  - Use "pass" if the company clearly meets the criterion
  - Use "fail" if the company clearly does not meet the criterion
  - Use "inconclusive" ONLY if you've tried relevant tools and still can't find sufficient data
  - Use "error" only if you cannot process the request
- "remarks": A brief explanation of your decision (1-2 sentences), including what sources you used

Respond with the JSON object only, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body: ScreeningRequest = await request.json();
    const { companyId, criteriaId, criteriaPrompt, company } = body;

    // Validate required fields
    if (!companyId || !criteriaId || !criteriaPrompt || !company) {
      return NextResponse.json(
        { error: "Missing required fields: companyId, criteriaId, criteriaPrompt, company" },
        { status: 400 }
      );
    }

    // Get the agent
    const agent = await getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not available. Please ensure ANTHROPIC_API_KEY is set." },
        { status: 500 }
      );
    }

    // Build company context string
    const companyContext = buildCompanyContext(company);

    // Get dynamically injected tool descriptions
    const toolDescriptions = getToolDescriptions();

    // Create the evaluation prompt with tool descriptions
    const evaluationPrompt = SCREENING_PROMPT_TEMPLATE
      .replace("{toolDescriptions}", toolDescriptions)
      .replace("{companyContext}", companyContext)
      .replace("{criteriaPrompt}", criteriaPrompt);

    // Invoke the agent with a timeout to prevent hanging
    // 4 minutes allows for multiple tool-call round trips (each ~10-30s) even under concurrent load
    console.log(`[AI-Screening] Invoking agent for company=${company.name}, criteria=${criteriaId}`);
    const AGENT_TIMEOUT_MS = 240_000; // 4 minutes timeout
    let result;
    try {
      result = await Promise.race([
        agent.invoke({
          messages: [new HumanMessage(evaluationPrompt)],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Agent invocation timed out")), AGENT_TIMEOUT_MS)
        ),
      ]);
    } catch (agentError) {
      const errorMsg = (agentError as Error).message;
      console.error(`[AI-Screening] Agent error for company=${company.name}: ${errorMsg}`);

      // Detect rate limit errors from the Anthropic SDK and surface them with 429 status
      const isRateLimit = errorMsg.includes('rate_limit') || errorMsg.includes('429') || errorMsg.includes('Rate limit');
      if (isRateLimit) {
        return NextResponse.json(
          {
            companyId,
            criteriaId,
            result: "error",
            remarks: "Rate limit exceeded. Request will be retried automatically.",
          },
          { status: 429 }
        );
      }

      // Return 504 Gateway Timeout for timeout errors so the frontend can detect and retry
      const isTimeout = errorMsg.includes('timed out');
      if (isTimeout) {
        return NextResponse.json(
          {
            companyId,
            criteriaId,
            result: "error",
            remarks: "Screening timed out. Will be retried automatically.",
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        {
          companyId,
          criteriaId,
          result: "error",
          remarks: `Agent error: ${errorMsg}`,
        },
        { status: 500 }
      );
    }

    // Extract the last message (AI's final response)
    const messages = result.messages;
    const msg = messages[messages.length - 1];
    const content = msg ? (typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)) : "";

    let screeningResult: ScreeningResult;
    try {
      const parsed = JSON.parse(content);
      screeningResult = ScreeningResultSchema.parse(parsed);
    } catch {
      // If direct parse fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          screeningResult = ScreeningResultSchema.parse(parsed);
        } catch {
          screeningResult = {
            result: "error",
            remarks: "Failed to parse AI response",
          };
        }
      } else {
        screeningResult = {
          result: "error",
          remarks: "AI response was not in expected format",
        };
      }
    }

    console.log(`[AI-Screening] Result for company=${company.name}, criteria=${criteriaId}: ${screeningResult.result}`);

    return NextResponse.json({
      companyId,
      criteriaId,
      ...screeningResult,
    });
  } catch (error) {
    console.error("AI Screening error:", error);

    // Detect rate limit errors thrown by the Anthropic SDK
    const errorMsg = (error as Error).message || "";
    const isRateLimit = errorMsg.includes('rate_limit') || errorMsg.includes('429') || errorMsg.includes('Rate limit');
    if (isRateLimit) {
      return NextResponse.json(
        {
          result: "error",
          remarks: "Rate limit exceeded. Request will be retried automatically.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: errorMsg || "Internal server error",
        result: "error",
        remarks: "An error occurred during screening",
      },
      { status: 500 }
    );
  }
}

/**
 * Build a human-readable context string from company data.
 */
function buildCompanyContext(company: CompanyData): string {
  const lines: string[] = [];

  lines.push(`**Company Name:** ${company.name || "Unknown"}`);

  if (company.segment) lines.push(`**Segment:** ${company.segment}`);
  if (company.geography) lines.push(`**Geography:** ${company.geography}`);
  if (company.company_focus) lines.push(`**Focus:** ${company.company_focus}`);
  if (company.ownership) lines.push(`**Ownership:** ${company.ownership}`);
  if (company.website) lines.push(`**Website:** ${company.website}`);

  // Financial data
  const financials: string[] = [];
  if (company.revenue_2022_usd_mn != null) financials.push(`Revenue 2022: $${company.revenue_2022_usd_mn}M`);
  if (company.revenue_2023_usd_mn != null) financials.push(`Revenue 2023: $${company.revenue_2023_usd_mn}M`);
  if (company.revenue_2024_usd_mn != null) financials.push(`Revenue 2024: $${company.revenue_2024_usd_mn}M`);
  if (company.ebitda_2022_usd_mn != null) financials.push(`EBITDA 2022: $${company.ebitda_2022_usd_mn}M`);
  if (company.ebitda_2023_usd_mn != null) financials.push(`EBITDA 2023: $${company.ebitda_2023_usd_mn}M`);
  if (company.ebitda_2024_usd_mn != null) financials.push(`EBITDA 2024: $${company.ebitda_2024_usd_mn}M`);
  if (company.ev_2024 != null) financials.push(`EV 2024: $${company.ev_2024}M`);

  if (financials.length > 0) {
    lines.push(`**Financials:**`);
    lines.push(financials.join(" | "));
  } else {
    lines.push(`**Financials:** No financial data available`);
  }

  return lines.join("\n");
}

// Health check endpoint
export async function GET() {
  const agent = await getAgentGraph();
  return NextResponse.json({
    status: agent ? "ready" : "not_configured",
    message: agent ? "AI Screening endpoint is ready" : "Agent not available. Check ANTHROPIC_API_KEY.",
  });
}
