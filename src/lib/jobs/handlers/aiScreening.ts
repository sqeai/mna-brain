import { getAgentGraph, HumanMessage } from '@/lib/agent';
import { getToolDescriptions } from '@/lib/agent/tools';
import { CompanyRepository, ScreeningRepository } from '@/lib/repositories';
import type { DbClient, Tables } from '@/lib/repositories';
import { z } from 'zod';
import { getPostHogClient } from '@/lib/posthog-server';

export const AI_SCREENING_TIMEOUT_SECONDS = 240;

const ScreeningResultSchema = z.object({
  result: z.enum(['pass', 'fail', 'inconclusive', 'error']),
  remarks: z.string(),
});

type ScreeningResult = z.infer<typeof ScreeningResultSchema>;

export interface AIScreeningPayload {
  companyId: string;
  criteriaId: string;
  criteriaPrompt: string;
  company: CompanyData;
  screeningId: string;
  jobId?: string;
}

export interface AIScreeningJobResult extends ScreeningResult {
  companyId: string;
  criteriaId: string;
  screeningId: string;
}

export interface CompanyData {
  id: string;
  name: string;
  segment?: string | null;
  segment_related_offerings?: string | null;
  geography?: string | null;
  revenue_2022_usd_mn?: number | null;
  revenue_2023_usd_mn?: number | null;
  revenue_2024_usd_mn?: number | null;
  ebitda_2022_usd_mn?: number | null;
  ebitda_2023_usd_mn?: number | null;
  ebitda_2024_usd_mn?: number | null;
  ebitda_margin_2022_pct?: number | null;
  ebitda_margin_2023_pct?: number | null;
  ebitda_margin_2024_pct?: number | null;
  ev_2024?: number | null;
  ev_ebitda_2024?: number | null;
  revenue_cagr_3y_pct?: number | null;
  company_focus?: string | null;
  ownership?: string | null;
  website?: string | null;
  combined_segment_revenue?: string | null;
  revenue_from_priority_geo_flag?: string | null;
  pct_from_domestic?: number | null;
  l0_ev_usd_mn?: number | null;
  l1_revenue_cagr_l3y?: number | null;
  l1_revenue_cagr_n3y?: number | null;
  l1_vision_fit?: string | null;
  l1_priority_geo_flag?: string | null;
  l1_ev_below_threshold?: string | null;
  l1_rationale?: string | null;
  l1_screening_result?: string | null;
  [key: string]: unknown;
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
- Use this context to make your decision. Focus on the context privided only
- If any ask you to get last year period data, get last year period data from the context provided, do not use current year data to make decision. For example, if the criteria ask you to get revenue growth from 2022 to 2023, get revenue data from 2022 and 2023 in the context provided, do not use 2024 revenue data to make decision.

Respond with the JSON object only, no additional text.`;

function buildCompanyContext(company: CompanyData): string {
  const lines: string[] = [];

  lines.push(`**Company Name:** ${company.name || 'Unknown'}`);

  if (company.segment) lines.push(`**Segment:** ${company.segment}`);
  if (company.segment_related_offerings)
    lines.push(`**Segment Related Offerings:** ${company.segment_related_offerings}`);
  if (company.geography) lines.push(`**Geography:** ${company.geography}`);
  if (company.company_focus) lines.push(`**Focus:** ${company.company_focus}`);
  if (company.ownership) lines.push(`**Ownership:** ${company.ownership}`);
  if (company.website) lines.push(`**Website:** ${company.website}`);
  if (company.combined_segment_revenue)
    lines.push(`**Combined Segment Revenue:** ${company.combined_segment_revenue}`);
  if (company.revenue_from_priority_geo_flag)
    lines.push(`**Revenue from Priority Geo:** ${company.revenue_from_priority_geo_flag}`);
  if (company.pct_from_domestic != null)
    lines.push(`**% from Domestic:** ${company.pct_from_domestic}%`);

  const financials: string[] = [];
  if (company.revenue_2022_usd_mn != null) financials.push(`Revenue 2022: $${company.revenue_2022_usd_mn}M`);
  if (company.revenue_2023_usd_mn != null) financials.push(`Revenue 2023: $${company.revenue_2023_usd_mn}M`);
  if (company.revenue_2024_usd_mn != null) financials.push(`Revenue 2024: $${company.revenue_2024_usd_mn}M`);
  if (company.ebitda_2022_usd_mn != null) financials.push(`EBITDA 2022: $${company.ebitda_2022_usd_mn}M`);
  if (company.ebitda_2023_usd_mn != null) financials.push(`EBITDA 2023: $${company.ebitda_2023_usd_mn}M`);
  if (company.ebitda_2024_usd_mn != null) financials.push(`EBITDA 2024: $${company.ebitda_2024_usd_mn}M`);
  if (company.ebitda_margin_2022_pct != null) financials.push(`EBITDA Margin 2022: ${company.ebitda_margin_2022_pct}%`);
  if (company.ebitda_margin_2023_pct != null) financials.push(`EBITDA Margin 2023: ${company.ebitda_margin_2023_pct}%`);
  if (company.ebitda_margin_2024_pct != null) financials.push(`EBITDA Margin 2024: ${company.ebitda_margin_2024_pct}%`);
  if (company.ev_2024 != null) financials.push(`EV 2024: $${company.ev_2024}M`);
  if (company.ev_ebitda_2024 != null) financials.push(`EV/EBITDA 2024: ${company.ev_ebitda_2024}x`);
  if (company.revenue_cagr_3y_pct != null) financials.push(`Revenue CAGR 3Y: ${company.revenue_cagr_3y_pct}%`);
  if (company.l0_ev_usd_mn != null) financials.push(`L0 EV: $${company.l0_ev_usd_mn}M`);

  if (financials.length > 0) {
    lines.push(`**Financials:**`);
    lines.push(financials.join(' | '));
  } else {
    lines.push(`**Financials:** No financial data available`);
  }

  const metrics: string[] = [];
  if (company.l1_revenue_cagr_l3y != null) metrics.push(`Revenue CAGR L3Y: ${company.l1_revenue_cagr_l3y}%`);
  if (company.l1_revenue_cagr_n3y != null) metrics.push(`Revenue CAGR N3Y: ${company.l1_revenue_cagr_n3y}%`);
  if (company.l1_vision_fit) metrics.push(`Vision Fit: ${company.l1_vision_fit}`);
  if (company.l1_priority_geo_flag) metrics.push(`Priority Geo Flag: ${company.l1_priority_geo_flag}`);
  if (company.l1_ev_below_threshold) metrics.push(`EV Below Threshold: ${company.l1_ev_below_threshold}`);
  if (company.l1_rationale) metrics.push(`L1 Rationale: ${company.l1_rationale}`);
  if (company.l1_screening_result) metrics.push(`L1 Screening Result: ${company.l1_screening_result}`);

  if (metrics.length > 0) {
    lines.push(`**Screening Metrics:**`);
    lines.push(metrics.join(' | '));
  }

  return lines.join('\n');
}

async function writeScreeningResult(
  screeningRepo: ScreeningRepository,
  screeningId: string,
  jobId: string,
  result: ScreeningResult,
): Promise<void> {
  const newState = result.result === 'error' ? 'failed' : 'completed';
  await screeningRepo.update(screeningId, {
    state: newState,
    result: result.result,
    remarks: result.remarks,
    job_id: jobId,
  } as Tables<'screenings'>);
}

export async function runAIScreening(
  payload: AIScreeningPayload,
  deps: { db: DbClient; job: Tables<'jobs'> },
): Promise<AIScreeningJobResult> {
  const { companyId, criteriaId, criteriaPrompt, company, screeningId } = payload;

  if (!companyId || !criteriaId || !criteriaPrompt || !company || !screeningId) {
    throw new Error(
      'Missing required fields: companyId, criteriaId, criteriaPrompt, company, screeningId',
    );
  }

  const agent = await getAgentGraph();
  if (!agent) {
    throw new Error('Agent not available. Please ensure ANTHROPIC_API_KEY is set.');
  }

  const companyRepo = new CompanyRepository(deps.db);
  const screeningRepo = new ScreeningRepository(deps.db);

  let enrichedCompany: CompanyData = { ...company };
  try {
    const dbCompany = await companyRepo.findById(companyId);
    enrichedCompany = {
      ...company,
      ...Object.fromEntries(
        Object.entries(dbCompany as Record<string, unknown>).filter(([, v]) => v != null),
      ),
    } as CompanyData;
  } catch (dbFetchError) {
    console.warn(
      `[AI-Screening] Could not fetch from DB: ${(dbFetchError as Error).message}. Using payload data.`,
    );
  }

  const companyContext = buildCompanyContext(enrichedCompany);
  const toolDescriptions = getToolDescriptions();

  const evaluationPrompt = SCREENING_PROMPT_TEMPLATE.replace(
    '{toolDescriptions}',
    toolDescriptions,
  )
    .replace('{companyContext}', companyContext)
    .replace('{criteriaPrompt}', criteriaPrompt);

  let agentResult;
  try {
    agentResult = await agent.invoke({ messages: [new HumanMessage(evaluationPrompt)] });
  } catch (agentError) {
    const errorMsg = (agentError as Error).message;
    const isRateLimit =
      errorMsg.includes('rate_limit') ||
      errorMsg.includes('429') ||
      errorMsg.includes('Rate limit');

    const remarks = isRateLimit
      ? 'Rate limit exceeded. Request will be retried automatically.'
      : `Agent error: ${errorMsg}`;
    const screeningResult: ScreeningResult = { result: 'error', remarks };
    await writeScreeningResult(screeningRepo, screeningId, deps.job.id, screeningResult);
    throw new Error(remarks);
  }

  const messages = agentResult.messages;
  const msg = messages[messages.length - 1];
  const content = msg
    ? typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content)
    : '';

  let screeningResult: ScreeningResult;
  try {
    screeningResult = ScreeningResultSchema.parse(JSON.parse(content));
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        screeningResult = ScreeningResultSchema.parse(JSON.parse(jsonMatch[0]));
      } catch {
        screeningResult = { result: 'error', remarks: 'Failed to parse AI response' };
      }
    } else {
      screeningResult = {
        result: 'error',
        remarks: 'AI response was not in expected format',
      };
    }
  }

  await writeScreeningResult(screeningRepo, screeningId, deps.job.id, screeningResult);

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: 'server',
    event: 'ai_screening_completed',
    properties: {
      company_id: companyId,
      company_name: company.name,
      criteria_id: criteriaId,
      result: screeningResult.result,
    },
  });

  return { companyId, criteriaId, screeningId, ...screeningResult };
}
