/**
 * Legal Brain Assistant tools: web search, Akta cross-checker, company details finder.
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { webSearch as agentWebSearch, getCompanyDetails as agentGetCompanyDetails } from "@/lib/agent/tools";
import { logger } from "@/lib/agent/logger";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }
  return createClient(url, key);
}

/** Re-export for Legal Brain: search the web for legal, regulatory, or company information. */
export const webSearch = agentWebSearch;

/** Re-export for Legal Brain: get detailed information about a company. */
export const getCompanyDetails = agentGetCompanyDetails;

/**
 * Akta cross-checker: cross-check document content (e.g. from an Akta or contract)
 * against internal company data and flag consistencies or gaps.
 */
export const aktaCrossChecker = tool(
  async ({
    document_summary,
    company_name,
  }: {
    document_summary: string;
    company_name?: string;
  }) => {
    logger.debug(
      `🔧 TOOL CALLED: akta_cross_checker(document_summary length=${document_summary?.length}, company_name='${company_name ?? ""}')`
    );

    try {
      const supabase = getSupabaseClient();
      const lines: string[] = ["## Akta / Document Cross-Check Result\n"];

      if (!document_summary?.trim()) {
        return "No document content provided. Please provide the document text or summary to cross-check.";
      }

      let companyRecord: Record<string, unknown> | null = null;
      if (company_name?.trim()) {
        const { data: companies, error } = await supabase
          .from("companies")
          .select("target, segment, geography, ownership, website, revenue_2024_usd_mn, ebitda_2024_usd_mn, pipeline_stage")
          .ilike("target", `%${company_name.trim()}%`)
          .limit(1);

        if (!error && companies?.length) {
          companyRecord = companies[0] as Record<string, unknown>;
        }
      }

      if (companyRecord) {
        const name = (companyRecord.target as string) || "N/A";
        lines.push("### Internal database match");
        lines.push(`- **Company:** ${name}`);
        lines.push(`- **Segment:** ${(companyRecord.segment as string) || "N/A"}`);
        lines.push(`- **Geography:** ${(companyRecord.geography as string) || "N/A"}`);
        lines.push(`- **Ownership:** ${(companyRecord.ownership as string) || "N/A"}`);
        lines.push(`- **Pipeline stage:** ${(companyRecord.pipeline_stage as string) || "N/A"}`);
        const rev = companyRecord.revenue_2024_usd_mn as number | undefined;
        const ebitda = companyRecord.ebitda_2024_usd_mn as number | undefined;
        if (rev != null) lines.push(`- **Revenue (2024):** $${rev.toFixed(1)}M`);
        if (ebitda != null) lines.push(`- **EBITDA (2024):** $${ebitda.toFixed(1)}M`);
        lines.push("");
        lines.push("Compare the document content above with this data to spot any mismatches (e.g. name spelling, address, directors, figures).");
      } else if (company_name?.trim()) {
        lines.push(`No internal record found for "${company_name}". Consider using **get_company_details** with a different spelling or **web_search** to verify the company.`);
      } else {
        lines.push("No company name was given. To cross-check against internal data, provide a **company_name** (e.g. from the document).");
      }

      lines.push("\n### Document excerpt used for cross-check");
      const excerpt =
        document_summary.length > 1200
          ? document_summary.slice(0, 1200) + "\n... [truncated]"
          : document_summary;
      lines.push(excerpt);

      logger.debug("✓ Akta cross-check completed");
      return lines.join("\n");
    } catch (error) {
      logger.error(`✗ Akta cross-check error: ${(error as Error).message}`);
      return `Cross-check error: ${(error as Error).message}`;
    }
  },
  {
    name: "akta_cross_checker",
    description: `Cross-check document content (e.g. from an Akta, deed, or contract) against internal company data.

Use this when the user:
- Uploads or pastes a document and wants it verified against known company information
- Asks to "cross-check" an Akta, deed, or contract
- Wants to verify that names, figures, or details in a document match internal records

Args:
  document_summary: The relevant text or summary extracted from the document (company name, addresses, figures, key terms).
  company_name: Optional. Company name as it appears in the document, used to fetch internal company details for comparison.

Returns:
  A cross-check report comparing the document to internal data, with any mismatches or gaps noted.`,
    schema: z.object({
      document_summary: z.string().describe("Text or summary from the document to cross-check"),
      company_name: z.string().optional().describe("Company name from the document for internal lookup"),
    }),
  }
);

export const legalBrainTools = [webSearch, getCompanyDetails, aktaCrossChecker];
