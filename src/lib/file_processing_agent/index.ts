import { supabase } from "@/integrations/supabase/client";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { createAgent } from "langchain";
import { logger } from "../agent/logger";
import { getAllCompanyReferences } from "../fuzzySearch";
import { splitPdf } from "../pdf";

const generateSystemPrompt = (companies_list, userRawNotes) => `You are a specialized M&A File Processing Assistant. Your task is to analyze raw text extracted from meeting documents (like PPTX slides) and transform it into a highly structured format.

## Objectives:
1. **Understand Unstructured Data**: Read the provided raw text carefully.
2. **Reformat to Structured JSON**: Extract a clear summary, key points, action items, and tags.
3. **Generate Tags**: Create a list of tags including company names mentioned and short highlights.
4. **Identify Companies**: Identify which of the "Known Companies" provided in the prompt are mentioned in the text.
5. **Extract Company Notes**: For each identified company, extract specific notes or context.
6. **Extract Meeting Date**: Identify the date of the meeting/document (usually mentioned in the title or content).
7. **Categorize The File Type**: Identify the file type of the document.
8. **Extract Prospectus Summary**: If the file type is "prospectus", extract a detailed summary of the prospectus.

## Known Companies:
${companies_list}

## Additional Notes:
These are additional notes from the user about the document that might be relevant to the analysis. Please use this to understand the context of the document better.
${userRawNotes}

## Process:
1. Review the "Known Companies" list.
2. Identify which of those companies appear in the text.
3. **Detect Codenames**: Actively scan for and include project codenames (such as "Project Utopia", "Project Tulia", "Project Notos", "Project gChem", etc.) even if they do not match the "Known Companies" list. Treat these as valid detected companies.
3. **Categorize File Type**: Choose between "prospectus", "mom", and "other" file type.
4. Final Output must be a valid JSON block containing:
   - summary: A concise overview of the meeting/document.
   - key_points: Array of main takeaways.
   - action_items: Array of next steps.
   - tags: Array of useful searchable tags (company names, topics).
   - companies_detected: Array of STRINGS (exact names as they appear in the Known Companies list) that were found in the text.
   - company_notes: Array of objects { "company_name": "...", "note": "..." } containing the specific context for that company.
   - file_date: A string representing the meeting date in YYYY-MM-DD format. If not found, return null.
   - prospectus_summary: Detailed variables of the prospectus file type. Only exist if the file type is "prospectus". Please take a look at the example output below to see the structure of the prospectus_summary.

## Output Format:
Your response should end with a JSON block in this format:
\`\`\`json
{
  "file_type": "...",
  "summary": "...",
  "key_points": ["...", "..."],
  "action_items": ["...", "..."],
  "tags": ["...", "..."],
  "companies_detected": ["Acme Corp", "Beta Ltd"],
  "company_notes": [
     { "company_name": "Acme Corp", "note": "Target price discussion..." }
  ],
  "file_date": "2024-01-30",
  "prospectus_summary": {
    "segment": "...",
    "target": "...",
    "segment_related_offerings": "...",
    "company_focus": "...",
    "website": "...",
    "watchlist_status": "...",
    "comments": "...",
    "ownership": "...",
    "geography": "country name",
    "revenue_2021_usd_mn": <numeric>,
    "revenue_2022_usd_mn": <numeric>,
    "revenue_2023_usd_mn": <numeric>,
    "revenue_2024_usd_mn": <numeric>,
    "ebitda_2021_usd_mn": <numeric>,
    "ebitda_2022_usd_mn": <numeric>,
    "ebitda_2023_usd_mn": <numeric>,
    "ebitda_2024_usd_mn": <numeric>,
    "ev_2024": <numeric>,
    "revenue_cagr_2021_2022": <numeric>,
    "revenue_cagr_2022_2023": <numeric>,
    "revenue_cagr_2023_2024": <numeric>,
    "ebitda_margin_2021": <numeric>,
    "ebitda_margin_2022": <numeric>,
    "ebitda_margin_2023": <numeric>,
    "ebitda_margin_2024": <numeric>,
    "ev_ebitda_2024": <numeric>,
    "segment_revenue": <numeric>,
    "segment_ebitda": <numeric>,
    "segment_revenue_total_ratio": <numeric>,
    "l0_ebitda_2024_usd_mn": <numeric>,
    "l0_ev_2024_usd_mn": <numeric>,
    "l0_revenue_2024_usd_mn": <numeric>,
    "l0_ev_ebitda_2024": <numeric>,
    "segment_specific_revenue_pct": <numeric>,
    "combined_segment_revenue": "...",
    "revenue_from_priority_geo_flag": "...",
    "pct_from_domestic": <numeric>,
    "l0_ev_usd_mn": <numeric>,
    "l1_revenue_cagr_l3y": <numeric>,
    "l1_revenue_drop_count": <numeric>,
    "l1_ebitda_below_threshold_count": <numeric>,
    "l1_revenue_cagr_n3y": <numeric>,
    "l1_vision_fit": "...",
    "l1_priority_geo_flag": "...",
    "l1_ev_below_threshold": "...",
    "l1_rationale": "...",
    "l1_revenue_no_consecutive_drop_usd": "...",
    "fx_revenue_2021": <numeric>,
    "fx_revenue_2022": <numeric>,
    "fx_revenue_2023": <numeric>,
    "fx_revenue_2024": <numeric>,
    "fx_currency": "...",
    "fx_assumed_forex_2021": <numeric>,
    "fx_assumed_forex_2022": <numeric>,
    "fx_assumed_forex_2023": <numeric>,
    "fx_assumed_forex_2024": <numeric>,
    "fx_forex_change_2021_2022": <numeric>,
    "fx_forex_change_2022_2023": <numeric>,
    "fx_forex_change_2023_2024": <numeric>,
    "fx_revenue_cagr_domestic_2021_2022": <numeric>,
    "fx_revenue_cagr_domestic_2022_2023": <numeric>,
    "fx_revenue_cagr_domestic_2023_2024": <numeric>,
    "fx_revenue_drop_count": <numeric>,
    "fx_revenue_no_consecutive_drop_local": "...",
    "fx_rationale": "...",
    "fx_ebitda_above_10_l3y": "...",
    "remarks": "A brief explanation of your decision (1-2 sentences), including what sources you used",
    "business_overview": "- **Primary Products**: ...\\n- **End Markets**: ...\\n...",
    "business_model_summary": "- **Core Focus**: ...\\n- **Value Chain Position**: ...\\n...",
    "key_takeaways": "1. **Takeaway title** explanation...\\n2. ...\\n...",
    "investment_highlights": "- **Market Position**: ...\\n- **Differentiation**: ...\\n...",
    "investment_risks": "- **Customer Concentration**: ...\\n- **Regulatory Exposure**: ...\\n...",
    "diligence_priorities": "1. Question one?\\n2. Question two?\\n..."
  }
}
\`\`\`

Always prioritize accuracy. Only list a company in 'companies_detected' if you are sure it matches one in the provided known list.`;

/**
 * Invoke the file processing agent.
 */
export async function processFileContent(rawText: string, buffer: Buffer, contentType: string, userRawNotes: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  // 1. Fetch all known companies to provide context
  const allReferences = await getAllCompanyReferences();

  // OPTIMIZATION: Inject only names to save tokens
  const allNames = allReferences.map(r => r.name).join(", ");

  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    anthropicApiKey: apiKey,
    temperature: 0,
  });

  const agent = createAgent({
    model: llm,
    tools: [], // No tools needed for this phase logic
    systemPrompt: generateSystemPrompt(allNames, userRawNotes),
  });

  // 2. Implement Anthropic Files API for PDF processing
  var inputs = {
    messages: [new HumanMessage(`Raw Content to process:\n\n${rawText}`)],
  };

  let lastMessage: BaseMessage | null = null;
  if (contentType === 'application/pdf') {
    logger.debug("📂 INVOKING FILE PROCESSING AGENT");

    const buffers = await splitPdf(buffer, 50);
    for (const buff of buffers) {
      // Extract and parse JSON from the last message content
      let lastParsedContent = "";
      if (lastMessage) {
        const rawContent = typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);
        const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            lastParsedContent = JSON.stringify(parsed);
          } catch {
            lastParsedContent = rawContent;
          }
        } else {
          lastParsedContent = rawContent;
        }
      }
      inputs = {
        messages: [new HumanMessage({
          content: [{
            type: 'text',
            text: `Analyze the following documents. This is the last state of the data. Please update: ${lastParsedContent}`,
          },
          {
            type: "file",
            source_type: "base64",
            data: buff.toString("base64"),
            mime_type: "application/pdf",
          },
          ],
        })],
      };
      // Cast messages to satisfy the agent's type requirements
      const result = await agent.invoke({ messages: inputs.messages } as any);
      const messagesList = result.messages as BaseMessage[];
      lastMessage = messagesList[messagesList.length - 1];
    }
  } else {
    const result = await agent.invoke(inputs as any);
    const messagesList = result.messages as BaseMessage[];
    lastMessage = messagesList[messagesList.length - 1];
  }

  // Extract the last message from the result
  const content = typeof lastMessage?.content === "string"
    ? lastMessage?.content
    : JSON.stringify(lastMessage?.content);

  // Extract JSON from the content
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);

      // Post-Processing: Client-side ID match
      // Map detected strings back to IDs
      const finalMatchedCompanies: any[] = [];
      const companiesDetected = parsed.companies_detected || [];

      for (const detectedName of companiesDetected) {
        // Find exact match in allReferences (case-insensitive search if needed, but agent should be exact)
        // We do a permissive find
        const match = allReferences.find(r => r.name.toLowerCase() === (detectedName as string).toLowerCase());
        if (match) {
          finalMatchedCompanies.push(match);
        } else {
          var companyId = null;
          if (parsed.file_type === 'prospectus') {
            const insertData = {
              // Pipeline stage for market screening
              pipeline_stage: 'L0',
              // Core fields
              target: parsed?.prospectus_summary?.target || null,
              thesis_content: null,
              // Basic info from schema
              segment: parsed?.prospectus_summary?.segment || null,
              segment_related_offerings: parsed?.prospectus_summary?.segment_related_offerings || null,
              company_focus: parsed?.prospectus_summary?.company_focus || null,
              website: parsed?.prospectus_summary?.website || null,
              ownership: parsed?.prospectus_summary?.ownership || null,
              geography: parsed?.prospectus_summary?.geography || null,
              // Revenue (USD Mn)
              revenue_2021_usd_mn: parsed?.prospectus_summary?.revenue_2021_usd_mn || null,
              revenue_2022_usd_mn: parsed?.prospectus_summary?.revenue_2022_usd_mn || null,
              revenue_2023_usd_mn: parsed?.prospectus_summary?.revenue_2023_usd_mn || null,
              revenue_2024_usd_mn: parsed?.prospectus_summary?.revenue_2024_usd_mn || null,
              // EBITDA (USD Mn)
              ebitda_2021_usd_mn: parsed?.prospectus_summary?.ebitda_2021_usd_mn || null,
              ebitda_2022_usd_mn: parsed?.prospectus_summary?.ebitda_2022_usd_mn || null,
              ebitda_2023_usd_mn: parsed?.prospectus_summary?.ebitda_2023_usd_mn || null,
              ebitda_2024_usd_mn: parsed?.prospectus_summary?.ebitda_2024_usd_mn || null,
              // Valuation
              ev_2024: parsed?.prospectus_summary?.ev_2024 || null,
              ev_ebitda_2024: parsed?.prospectus_summary?.ev_ebitda_2024 || null,
              // Growth metrics
              revenue_cagr_2021_2022: parsed?.prospectus_summary?.revenue_cagr_2021_2022 || null,
              revenue_cagr_2022_2023: parsed?.prospectus_summary?.revenue_cagr_2022_2023 || null,
              revenue_cagr_2023_2024: parsed?.prospectus_summary?.revenue_cagr_2023_2024 || null,
              // Margins
              ebitda_margin_2021: parsed?.prospectus_summary?.ebitda_margin_2021 || null,
              ebitda_margin_2022: parsed?.prospectus_summary?.ebitda_margin_2022 || null,
              ebitda_margin_2023: parsed?.prospectus_summary?.ebitda_margin_2023 || null,
              ebitda_margin_2024: parsed?.prospectus_summary?.ebitda_margin_2024 || null,
              // AI-generated remarks cross-matched with thesis
              remarks: parsed?.prospectus_summary?.remarks || null,
            }
            const { data: company, error: insertError } = await supabase
              .from('companies')
              .insert(insertData)
              .select()
              .single();
            if (insertError) {
              logger.error('Error inserting companies results:');
            } else if (company) {
              companyId = company.id;

              const { error: insertError } = await supabase
                .from("company_analyses")
                .insert({
                  company_id: companyId,
                  status: "completed",
                  business_overview: parsed?.prospectus_summary?.business_overview || null,
                  business_model_summary: parsed?.prospectus_summary?.business_model_summary || null,
                  key_takeaways: parsed?.prospectus_summary?.key_takeaways || null,
                  investment_highlights: parsed?.prospectus_summary?.investment_highlights || null,
                  investment_risks: parsed?.prospectus_summary?.investment_risks || null,
                  diligence_priorities: parsed?.prospectus_summary?.diligence_priorities || null,
                  sources: [{ type: 'prospectus' }],
                  error_message: null,
                });
              if (insertError) {
                logger.error('Error inserting company_analyses results:');
              }
            }
          }

          finalMatchedCompanies.push({
            id: companyId,
            name: detectedName,
            type: 'company',
            similarity: 1
          });
        }
      }

      // Add to final output
      parsed.matched_companies = finalMatchedCompanies;

      // Also trigger add_company_note logic if notes are present
      // We can do this here or let the API handler deal with it. 
      // Since the tool is removed from agent, we must do it manually if we want the side effect, 
      // OR just return the data structure and let the caller handle DB updates.
      // Based on previous flow, the API endpoint handles DB updates using the returned 'matched_companies'.
      // We should ensure 'company_notes' are also passed or handled.
      // For now, minimal regression: The API uses 'matched_companies' to update the meeting note record.
      // If we want to persist notes to the company record, we should loop through company_notes here.

      if (parsed.company_notes && Array.isArray(parsed.company_notes)) {
        for (const noteObj of parsed.company_notes) {
          const match = allReferences.find(r => r.name.toLowerCase() === (noteObj.company_name as string).toLowerCase());
          if (match) {
            // We invoke the tool logic manually or skip it?
            // The original requirement was "add it to the companies detected".
            // The API route likely reads 'matched_companies' and saves it to the DB column.
            // Direct DB linking (add_company_note) was an agent tool action.
            // We will attempt to invoke the tool functionality manually if we can, 
            // OR simply return this data. 
            // Given the instructions: "structure it... match it... store it". 
            // We will attach the note content to the matched_companies object so the caller (API) can use it if needed,
            // or just rely on the 'matched_companies' column in files table.

            // Let's augment the matched company object with the note
            const recordIndex = finalMatchedCompanies.findIndex(m => m.id === match.id);
            if (recordIndex >= 0) {
              finalMatchedCompanies[recordIndex].note = noteObj.note;
            }
          }
        }
      }

      parsed.matched_companies = finalMatchedCompanies;

      if (!parsed.file_type) {
        parsed.file_type = 'other';
      }

      return parsed;
    } catch (e) {
      logger.error("Failed to parse JSON from agent response:");
      return { raw_response: content };
    }
  }

  return { raw_response: content };
}
