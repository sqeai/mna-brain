import { NextRequest, NextResponse } from 'next/server';
import { getAgentGraph, HumanMessage } from '@/lib/agent';
import { createSupabaseClient } from '@/lib/server/supabase';
import { companiesSchema } from '@/lib/agent/tools';
import { CompanyRepository, InvestmentThesisRepository } from '@/lib/repositories';
import { getPostHogClient } from '@/lib/posthog-server';

function getSchemaFieldsForPrompt(): string {
  const excludeFields = ['id', 'entry_id', 'watchlist_id', 'watchlist_status', 'pipeline_stage', 'comments'];
  return companiesSchema
    .filter(col => !excludeFields.includes(col.name))
    .map(col => `      "${col.name}": ${col.type === 'numeric' ? 'number or null' : '"string or null"'}`)
    .join(',\n');
}

interface DiscoveredCompany {
  company_name: string;
  target?: string;
  segment?: string;
  segment_related_offerings?: string;
  company_focus?: string;
  website?: string;
  ownership?: string;
  geography?: string;
  revenue_2021_usd_mn?: number;
  revenue_2022_usd_mn?: number;
  revenue_2023_usd_mn?: number;
  revenue_2024_usd_mn?: number;
  ebitda_2021_usd_mn?: number;
  ebitda_2022_usd_mn?: number;
  ebitda_2023_usd_mn?: number;
  ebitda_2024_usd_mn?: number;
  ev_2024?: number;
  ev_ebitda_2024?: number;
  revenue_cagr_2021_2022?: number;
  revenue_cagr_2022_2023?: number;
  revenue_cagr_2023_2024?: number;
  ebitda_margin_2021?: number;
  ebitda_margin_2022?: number;
  ebitda_margin_2023?: number;
  ebitda_margin_2024?: number;
  remarks?: string;
  sector?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { thesis, sourcesCount = 5, thesisId } = await request.json();

    if (!thesis) {
      return NextResponse.json({ error: 'Investment thesis is required' }, { status: 400 });
    }

    const agent = await getAgentGraph();
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not available. Please ensure ANTHROPIC_API_KEY is set.' },
        { status: 500 },
      );
    }

    const db = createSupabaseClient();
    const companyRepo = new CompanyRepository(db);
    const thesisRepo = new InvestmentThesisRepository(db);

    const existingNames = (await companyRepo.findTargetNames()).join(', ');
    const schemaFields = getSchemaFieldsForPrompt();

    const prompt = `You are an M&A analyst conducting market screening. Use web_search to find REAL acquisition target companies that match the following investment thesis.

## Investment Thesis
${thesis}

## CRITICAL INSTRUCTIONS
1. **ONLY USE WEB SEARCH** - Do NOT query the internal database. Search the web for companies.
2. **EXCLUDE EXISTING COMPANIES** - Do NOT include any of these companies already in our pipeline: ${existingNames || 'None'}
3. **FIND NEW TARGETS** - Focus on discovering NEW companies we haven't tracked yet
4. **REAL COMPANIES ONLY** - Only return actual companies you find through web search with verifiable information
5. **RESEARCH THOROUGHLY** - For each company, search for as much data as possible including financial metrics, revenue, EBITDA, ownership type, and geographic presence.

## Search Strategy
- Search for "${thesis.substring(0, 100)}" companies for acquisition
- Look for private equity targets, mid-market companies, and acquisition candidates
- Focus on companies with $10M - $500M revenue range
- Search for companies with available financial information
- For each company found, search specifically for their financial data (revenue, EBITDA, valuation)

## Data Fields to Research
For each company, try to find and populate ALL of these fields (use null if data not available):
- target: Company name
- segment: Industry/sector classification
- segment_related_offerings: Specific products/services in the segment
- company_focus: Main business focus and offerings
- website: Company website URL
- ownership: "Private", "Public", or "PE-backed"
- geography: Headquarters country/region
- revenue_2021_usd_mn through revenue_2024_usd_mn: Annual revenue in USD millions
- ebitda_2021_usd_mn through ebitda_2024_usd_mn: Annual EBITDA in USD millions
- ev_2024: Enterprise value in USD millions
- ev_ebitda_2024: EV/EBITDA multiple
- revenue_cagr_{year1}_{year2}: Revenue growth rate between years
- ebitda_margin_{year}: EBITDA margin percentage for each year

## Remarks Field (IMPORTANT)
For each company, generate a "remarks" field that provides a concise assessment of how the company aligns with the investment thesis. The remarks should:
- Cross-reference the company's characteristics against each key point of the investment thesis
- Highlight which thesis criteria are met and which are not
- Note any standout strengths or concerns relative to the thesis
- Be concise (2-4 sentences) but substantive

## Required Output Format
After searching, return your findings as a JSON object with EXACTLY this structure (no markdown, just raw JSON):
{
  "companies": [
    {
      "company_name": "Company Name (REQUIRED)",
      "remarks": "Concise thesis cross-match assessment (2-4 sentences)",
${schemaFields}
    }
  ]
}

Find ${sourcesCount} companies. Return ONLY the JSON object, no other text. Use null for any fields where data is not available.`;

    const result = await agent.invoke({ messages: [new HumanMessage(prompt)] });

    const aiMessages = result.messages.filter(
      (m: { _getType?: () => string; constructor?: { name: string } }) =>
        m._getType?.() === 'ai' || m.constructor?.name === 'AIMessage',
    );
    const msg = aiMessages[aiMessages.length - 1];
    const responseText = msg
      ? typeof msg.content === 'string'
        ? msg.content
        : JSON.stringify(msg.content)
      : '';

    let companies: DiscoveredCompany[] = [];
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*"companies"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        companies = parsed.companies || [];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    if (companies.length === 0) {
      return NextResponse.json({ count: 0, message: 'No companies found matching the thesis' });
    }

    const filteredCompanies = companies.filter(
      (company) => !existingNames.toLowerCase().includes(company.company_name.toLowerCase()),
    );

    if (filteredCompanies.length === 0) {
      return NextResponse.json({
        count: 0,
        message: 'All found companies are already in the database',
      });
    }

    await companyRepo.insertMany(
      filteredCompanies.map((company) => ({
        pipeline_stage: 'market_screening',
        target: company.target || company.company_name,
        thesis_content: thesis,
        segment: company.segment || company.sector,
        segment_related_offerings: company.segment_related_offerings,
        company_focus: company.company_focus,
        website: company.website,
        ownership: company.ownership,
        geography: company.geography,
        revenue_2021_usd_mn: company.revenue_2021_usd_mn,
        revenue_2022_usd_mn: company.revenue_2022_usd_mn,
        revenue_2023_usd_mn: company.revenue_2023_usd_mn,
        revenue_2024_usd_mn: company.revenue_2024_usd_mn,
        ebitda_2021_usd_mn: company.ebitda_2021_usd_mn,
        ebitda_2022_usd_mn: company.ebitda_2022_usd_mn,
        ebitda_2023_usd_mn: company.ebitda_2023_usd_mn,
        ebitda_2024_usd_mn: company.ebitda_2024_usd_mn,
        ev_2024: company.ev_2024,
        ev_ebitda_2024: company.ev_ebitda_2024,
        revenue_cagr_2021_2022: company.revenue_cagr_2021_2022,
        revenue_cagr_2022_2023: company.revenue_cagr_2022_2023,
        revenue_cagr_2023_2024: company.revenue_cagr_2023_2024,
        ebitda_margin_2021: company.ebitda_margin_2021,
        ebitda_margin_2022: company.ebitda_margin_2022,
        ebitda_margin_2023: company.ebitda_margin_2023,
        ebitda_margin_2024: company.ebitda_margin_2024,
        remarks: company.remarks || null,
        source: 'outbound',
      })),
    );

    if (thesisId) {
      const nextScan = new Date();
      nextScan.setDate(nextScan.getDate() + 7);
      await thesisRepo.update(thesisId, {
        last_scan_at: new Date().toISOString(),
        next_scan_at: nextScan.toISOString(),
      });
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: 'server',
      event: 'market_screening_completed',
      properties: {
        companies_discovered: filteredCompanies.length,
        sources_requested: sourcesCount,
        has_thesis_id: !!thesisId,
      },
    });

    return NextResponse.json({
      count: filteredCompanies.length,
      companies: filteredCompanies.map((c) => c.company_name),
    });
  } catch (error: unknown) {
    console.error('Market screening error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const agent = await getAgentGraph();
  return NextResponse.json({
    status: agent ? 'ok' : 'not_configured',
    message: agent ? 'Agent is ready' : 'Agent not available. Check ANTHROPIC_API_KEY.',
  });
}
