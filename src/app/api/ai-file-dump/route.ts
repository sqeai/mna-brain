/**
 * API Route for AI File Dump
 * Handles POST (upload) and GET (list) requests for file dumps
 */
import { extractTextFromFile } from "@/lib/fileExtractor";
import { processFileContent } from "@/lib/file_processing_agent";
import { downloadFile, getSignedUrl } from "@/lib/s3";
import { createSupabaseClient } from "@/lib/server/supabase";
import {
  FileRepository,
  CompanyAnalysisRepository,
  CriteriaRepository,
  ScreeningRepository,
} from "@/lib/repositories";
import type { Tables } from "@/lib/repositories";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST - Upload a new file
 */
export async function POST(request: NextRequest) {
  try {
    const { key, fileName, contentType, raw_notes: userRawNotes } = await request.json();

    if (!key || !fileName) {
      return NextResponse.json(
        { error: "key and fileName are required" },
        { status: 400 },
      );
    }

    const buffer = await downloadFile(key);
    const s3Key = key as string;
    const fileType = (contentType as string) || "application/octet-stream";

    const db = createSupabaseClient();
    const fileRepo = new FileRepository(db);
    const companyAnalysisRepo = new CompanyAnalysisRepository(db);
    const criteriaRepo = new CriteriaRepository(db);
    const screeningRepo = new ScreeningRepository(db);

    const initialData = await fileRepo.insert({
      file_name: fileName,
      file_link: s3Key,
      processing_status: "processing",
      file_type: "other",
    });

    let rawText = "";
    let structuredResult: Awaited<ReturnType<typeof processFileContent>> = null;
    let tags: string[] = [];
    let matched_companies: unknown[] = [];

    try {
      const isPdf =
        fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        rawText = await extractTextFromFile(buffer, fileType, fileName);
      }

      structuredResult = await processFileContent(
        rawText,
        buffer,
        fileType,
        userRawNotes,
        db,
      );

      if (structuredResult) {
        tags = structuredResult.tags || [];
        matched_companies = structuredResult.matched_companies || [];
      }

      await fileRepo.updatePartial(initialData.id, {
        raw_notes: rawText,
        file_type: structuredResult?.file_type || "other",
        structured_notes: structuredResult
          ? JSON.stringify(structuredResult, null, 2)
          : null,
        tags: tags,
        matched_companies: matched_companies as Tables<'files'>['matched_companies'],
        file_date: structuredResult?.file_date || null,
        processing_status: "completed",
      });
    } catch (processError) {
      console.error("Error during file processing:", processError);
      await fileRepo.updatePartial(initialData.id, {
        processing_status: "failed",
        raw_notes: rawText || "Extraction failed",
      });
    }

    const updatedData = await fileRepo.findById(initialData.id);

    const company = structuredResult?.company;
    if (!company || !company.id) {
      return await responseSuccess(s3Key, updatedData);
    }

    await companyAnalysisRepo.insert({
      company_id: company.id,
      status: "generating",
    });

    const baseUrl = request.nextUrl.origin;

    fetch(`${baseUrl}/api/company-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: company.id,
        source: structuredResult?.file_type || "other",
      }),
    }).catch((err) => {
      console.error("Error triggering company analysis:", err);
    });

    (async () => {
      try {
        const criteriaList = await criteriaRepo.findAll();

        if (criteriaList.length === 0) {
          console.log("No screening criteria found, skipping ai-screening");
          return;
        }

        const companyData = {
          id: company.id,
          name: company.target || company.name,
          segment: company.segment,
          geography: company.geography,
          company_focus: company.company_focus,
          ownership: company.ownership,
          website: company.website,
          revenue_2022_usd_mn: company.revenue_2022_usd_mn,
          revenue_2023_usd_mn: company.revenue_2023_usd_mn,
          revenue_2024_usd_mn: company.revenue_2024_usd_mn,
          ebitda_2022_usd_mn: company.ebitda_2022_usd_mn,
          ebitda_2023_usd_mn: company.ebitda_2023_usd_mn,
          ebitda_2024_usd_mn: company.ebitda_2024_usd_mn,
          ev_2024: company.ev_2024,
        };

        for (const criterion of criteriaList) {
          const screeningEntry = await screeningRepo.insert({
            company_id: company.id,
            criteria_id: criterion.id,
            state: "pending",
          });

          fetch(`${baseUrl}/api/ai-screening`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyId: company.id,
              criteriaId: criterion.id,
              criteriaPrompt: criterion.prompt,
              company: companyData,
            }),
          })
            .then(async (response) => {
              const data = await response.json();
              const newState = data.result === "error" ? "failed" : "completed";
              await screeningRepo.update(screeningEntry.id, {
                state: newState,
                result: data.result,
                remarks: data.remarks,
              });
            })
            .catch(async (err) => {
              console.error(
                `Error triggering ai-screening for criterion ${criterion.id}:`,
                err,
              );
              await screeningRepo.update(screeningEntry.id, {
                state: "failed",
                result: "error",
                remarks: "API call failed",
              });
            });
        }
      } catch (err) {
        console.error("Error in ai-screening flow:", err);
      }
    })();

    return await responseSuccess(s3Key, updatedData);
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload file" },
      { status: 500 },
    );
  }

  async function responseSuccess(s3Key: string, updatedData: Tables<'files'>) {
    const signedUrl = await getSignedUrl(s3Key);
    return NextResponse.json({
      success: true,
      data: { ...updatedData, signed_url: signedUrl },
    });
  }
}

/**
 * GET - List all files with signed URLs
 */
export async function GET(request: NextRequest) {
  try {
    const fileType = request.nextUrl.searchParams.get("file_type") ?? undefined;
    const db = createSupabaseClient();
    const fileRepo = new FileRepository(db);

    const files = await fileRepo.findAll(fileType);

    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        try {
          const signedUrl = await getSignedUrl(file.file_link);
          return { ...file, signed_url: signedUrl };
        } catch (urlError) {
          console.error(`Error generating signed URL for ${file.file_link}:`, urlError);
          return { ...file, signed_url: null };
        }
      }),
    );

    return NextResponse.json({ success: true, data: filesWithUrls });
  } catch (error) {
    console.error("Fetch files error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch files" },
      { status: 500 },
    );
  }
}

/**
 * PATCH - Update a file record
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const db = createSupabaseClient();
    const fileRepo = new FileRepository(db);

    const data = await fileRepo.update(id, updates);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Update file error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update file record" },
      { status: 500 },
    );
  }
}
