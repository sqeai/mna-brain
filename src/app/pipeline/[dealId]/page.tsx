'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  ArrowLeft,
  FileText,
  Link as LinkIcon,
  Upload,
  Plus,
  Loader2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Search,
  Briefcase,
  Globe,
  Sparkles,
  Download,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CompanyAnalysisSection } from '@/components/pipeline/CompanyAnalysisSection';
import FilePreview from '@/components/MeetingNotes/FilePreview';
import { FinancialCharts } from '@/components/pipeline/FinancialCharts';
import { DealStage } from '@/lib/types';
import { STAGE_LABELS } from '@/lib/constants';
import { formatDistanceToNow, format } from 'date-fns';

const websiteHref = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

const getStageLabel = (stage: string | null): string => {
  const key = (stage || 'L0') as DealStage;
  return STAGE_LABELS[key] ?? key;
};

interface CompanyData {
  id: string;
  target: string | null;
  segment: string | null;
  pipeline_stage: string | null;
  website: string | null;
  geography: string | null;
  ownership: string | null;
  comments: string | null;
  company_focus: string | null;
  // Revenue fields (USD Mn)
  revenue_2021_usd_mn: number | null;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;
  // EBITDA fields (USD Mn)
  ebitda_2021_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;
  // EV/Valuation
  ev_2024: number | null;
  // L1 screening results
  l1_screening_result: string | null;
  l1_rationale: string | null;
  l1_vision_fit: string | null;
  l1_priority_geo_flag: string | null;
  l1_ev_below_threshold: string | null;
  l1_revenue_no_consecutive_drop_usd: string | null;
  // EBITDA margin
  ebitda_margin_2021: number | null;
  ebitda_margin_2022: number | null;
  ebitda_margin_2023: number | null;
  ebitda_margin_2024: number | null;
  // AI Market Screening Remarks
  remarks?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DealNote {
  id: string;
  content: string;
  stage: string;
  created_at: string | null;
}

interface DealLink {
  id: string;
  url: string;
  title: string | null;
  stage: string;
  created_at: string | null;
}

interface DealDocument {
  id: string;
  file_name: string;
  file_path: string;
  stage: string;
  created_at: string | null;
}

interface CompanyAnalysis {
  id?: string;
  company_id: string;
  status: string;
  business_overview: string | null;
  business_model_summary: string | null;
  key_takeaways: string | null;
  investment_highlights: string | null;
  investment_risks: string | null;
  diligence_priorities: string | null;
  sources: AnalysisSource[] | null;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AnalysisSource {
  type: string;
  url?: string;
  title?: string;
}

const formatCurrency = (value: number | null) => {
  if (value === null) return '-';
  // Values in the DB are in USD Mn, so multiply by 1M for display
  const actualValue = value * 1_000_000;
  if (actualValue >= 1_000_000_000) return `$${(actualValue / 1_000_000_000).toFixed(2)}B`;
  if (actualValue >= 1_000_000) return `$${(actualValue / 1_000_000).toFixed(2)}M`;
  if (actualValue >= 1_000) return `$${(actualValue / 1_000).toFixed(2)}K`;
  return `$${actualValue.toFixed(0)}`;
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = params.dealId as string;
  const returnTo = searchParams.get('from') || '/pipeline';

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [links, setLinks] = useState<DealLink[]>([]);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<CompanyAnalysis | null>(null);
  const [analysisGenerating, setAnalysisGenerating] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      if (data) {
        setCompany(data as CompanyData);
        fetchDetails();
        fetchAnalysis();
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    if (!companyId) return;
    try {
      const [notesRes, linksRes, docsRes] = await Promise.all([
        supabase
          .from('deal_notes')
          .select('*')
          .eq('deal_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_links')
          .select('*')
          .eq('deal_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_documents')
          .select('*')
          .eq('deal_id', companyId)
          .order('created_at', { ascending: false }),
      ]);

      if (notesRes.data) setNotes(notesRes.data);
      if (linksRes.data) setLinks(linksRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const fetchAnalysis = async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/company-analysis?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
        // If still generating, poll until complete
        if (data.status === 'generating') {
          setAnalysisGenerating(true);
          pollAnalysis();
        }
      }
      // 404 is fine — no analysis yet
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const pollAnalysis = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/company-analysis?companyId=${companyId}`);
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
          if (data.status !== 'generating') {
            setAnalysisGenerating(false);
            clearInterval(interval);
          }
        }
      } catch {
        clearInterval(interval);
        setAnalysisGenerating(false);
      }
    }, 5000);
    // Clean up after 5 minutes max
    setTimeout(() => {
      clearInterval(interval);
      setAnalysisGenerating(false);
    }, 300000);
  };

  const generateAnalysis = async () => {
    if (!companyId) return;
    setAnalysisGenerating(true);

    try {
      const res = await fetch('/api/company-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate analysis');
      }

      const data = await res.json();
      setAnalysis(data);
      toast.success('AI Company Card generated successfully');
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast.error((error as Error).message || 'Failed to generate AI Company Card');
      // Re-fetch to get the latest status (might be 'failed')
      fetchAnalysis();
    } finally {
      setAnalysisGenerating(false);
    }
  };

  const regenerateAnalysis = async () => {
    if (!companyId) return;

    try {
      // Delete existing analysis first
      await fetch(`/api/company-analysis?companyId=${companyId}`, {
        method: 'DELETE',
      });
      setAnalysis(null);
    } catch {
      // Continue even if delete fails
    }

    // Generate fresh
    await generateAnalysis();
  };

  const addNote = async () => {
    if (!newNote.trim() || !company) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('deal_notes').insert({
        deal_id: company.id,
        content: newNote,
        stage: company.pipeline_stage || 'L0',
      });
      if (error) throw error;
      setNewNote('');
      await fetchDetails();
      toast.success('Note added');
    } catch (error: unknown) {
      console.error('Add note error:', error);
      toast.error((error as Error)?.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLink = async () => {
    if (!newLinkUrl.trim() || !company) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('deal_links').insert({
        deal_id: company.id,
        url: newLinkUrl,
        title: newLinkTitle || null,
        stage: company.pipeline_stage || 'L0',
      });
      if (error) throw error;
      setNewLinkUrl('');
      setNewLinkTitle('');
      await fetchDetails();
      toast.success('Link added');
    } catch (error: unknown) {
      console.error('Add link error:', error);
      toast.error((error as Error)?.message || 'Failed to add link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    setIsSubmitting(true);
    try {
      const contentType = file.type || 'application/octet-stream';

      let uploadUrlRes: Response;
      try {
        uploadUrlRes = await fetch(
          `/api/deal-documents/upload-url?dealId=${encodeURIComponent(company.id)}&fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(contentType)}`
        );
      } catch (netErr) {
        throw new Error('Could not reach server. Check your connection and that the app is running.');
      }
      const uploadUrlText = await uploadUrlRes.text();
      let uploadUrlData: { success?: boolean; error?: string; data?: { uploadUrl: string; key: string } };
      try {
        uploadUrlData = JSON.parse(uploadUrlText);
      } catch {
        throw new Error(uploadUrlRes.ok ? 'Invalid server response' : `Get upload URL failed: ${uploadUrlRes.status}`);
      }
      if (!uploadUrlData.success || !uploadUrlData.data) {
        throw new Error(uploadUrlData.error || 'Failed to get upload URL');
      }
      const { uploadUrl, key } = uploadUrlData.data;

      let s3Res: Response;
      try {
        s3Res = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': contentType },
        });
      } catch (netErr) {
        throw new Error(
          'Upload to storage failed (network error). Ensure AWS_S3_BUCKET matches your bucket and the bucket has CORS enabled for this origin.'
        );
      }
      if (!s3Res.ok) throw new Error('Failed to upload file to storage');

      let registerRes: Response;
      try {
        registerRes = await fetch('/api/deal-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: company.id,
            key,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || null,
            stage: company.pipeline_stage || 'L0',
          }),
        });
      } catch (netErr) {
        throw new Error('Could not register document. Check your connection.');
      }
      const registerText = await registerRes.text();
      let registerData: { success?: boolean; error?: string };
      try {
        registerData = registerText ? JSON.parse(registerText) : {};
      } catch {
        throw new Error(registerRes.ok ? 'Invalid server response' : `Register failed: ${registerRes.status}`);
      }
      if (!registerData.success) {
        throw new Error(registerData.error || 'Failed to register document');
      }

      await fetchDetails();
      toast.success('Document uploaded');
      e.target.value = '';
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error((error as Error)?.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await supabase.from('deal_notes').delete().eq('id', noteId);
      fetchDetails();
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      await supabase.from('deal_links').delete().eq('id', linkId);
      fetchDetails();
      toast.success('Link deleted');
    } catch (error) {
      toast.error('Failed to delete link');
    }
  };

  const deleteDocument = async (doc: DealDocument) => {
    try {
      const res = await fetch(`/api/deal-documents?id=${encodeURIComponent(doc.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete document');
      }
      fetchDetails();
      toast.success('Document deleted');
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to delete document');
    }
  };

  const downloadDocument = async (doc: DealDocument) => {
    try {
      const res = await fetch(`/api/deal-documents/download-url?id=${encodeURIComponent(doc.id)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get download URL');
      }
      const url = data.url;
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
      a.click();
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to download document');
    }
  };

  const handleOpenPreview = async (doc: DealDocument) => {
    setPreviewDoc(doc);
    setLoadingPreview(true);
    setPreviewUrl(null);
    try {
      const res = await fetch(
        `/api/deal-documents/download-url?id=${encodeURIComponent(doc.id)}&preview=true`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get preview URL');
      }
      setPreviewUrl(data.url);
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to load preview');
      setPreviewDoc(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const getL1StatusIcon = (value: string | null) => {
    if (value === 'Yes' || value === 'Pass') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (value === 'No' || value === 'Fail') return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-muted-foreground">Company not found</p>
          <Button onClick={() => router.push(returnTo)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(returnTo)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Building2 className="h-6 w-6" />
                {company.target || 'Unnamed Company'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{company.segment || 'N/A'}</Badge>
                <Badge variant="secondary">{getStageLabel(company.pipeline_stage)}</Badge>
                {company.l1_screening_result && (
                  <Badge variant={company.l1_screening_result === 'Pass' ? 'default' : 'destructive'}>
                    L1: {company.l1_screening_result}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="company-card" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-3 max-w-lg">
              <TabsTrigger value="company-card">Company Card</TabsTrigger>
              <TabsTrigger value="filters">L1 Screening</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>
            <div className="flex flex-col items-end gap-1">
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                onClick={analysis?.status === 'completed' ? regenerateAnalysis : generateAnalysis}
                disabled={analysisGenerating}
              >
                {analysisGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {analysisGenerating
                  ? 'Generating...'
                  : analysis?.status === 'completed'
                    ? 'Regenerate'
                    : 'AI Company Card'}
              </Button>
              {analysis?.updated_at && analysis.status === 'completed' && (
                <span className="text-xs text-muted-foreground">
                  Last: {format(new Date(analysis.updated_at), 'MMM d, yyyy HH:mm')}
                </span>
              )}
            </div>
          </div>

          <TabsContent value="company-card" className="space-y-6 mt-6">
            {/* AI Market Scanning Remarks */}
            {company.remarks && (
              <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI Market Scanning Remarks
                    </CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Discovered
                    </Badge>
                  </div>
                  {company.segment && (
                    <p className="text-sm text-muted-foreground">
                      Matched against: {company.segment}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50/80 dark:bg-purple-950/30">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4" />
                      Why This Company Matches Your Investment Thesis
                    </p>
                    <p className="text-sm leading-relaxed">{company.remarks}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Company Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-semibold">{company.target || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    {company.website ? (
                      <a href={websiteHref(company.website)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        {company.website}
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-sm">Not available</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Segment</p>
                    <p className="font-medium">{company.segment || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Geography</p>
                    <p className="font-medium">{company.geography || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ownership</p>
                    <Badge variant="outline">{company.ownership || 'Private'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company Focus</p>
                    <p className="font-medium text-sm">{company.company_focus || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Stage</p>
                    <Badge variant="outline">{getStageLabel(company.pipeline_stage)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">EV (2024)</p>
                    <p className="font-semibold text-primary">{formatCurrency(company.ev_2024)}</p>
                  </div>
                </div>
                {/* Comments Section */}
                {company.comments && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Comments</p>
                    <p className="text-sm">{company.comments}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Charts */}
            <FinancialCharts
              revenue_year1={company.revenue_2022_usd_mn ? company.revenue_2022_usd_mn * 1_000_000 : null}
              revenue_year2={company.revenue_2023_usd_mn ? company.revenue_2023_usd_mn * 1_000_000 : null}
              revenue_year3={company.revenue_2024_usd_mn ? company.revenue_2024_usd_mn * 1_000_000 : null}
              ebitda_year1={company.ebitda_2022_usd_mn ? company.ebitda_2022_usd_mn * 1_000_000 : null}
              ebitda_year2={company.ebitda_2023_usd_mn ? company.ebitda_2023_usd_mn * 1_000_000 : null}
              ebitda_year3={company.ebitda_2024_usd_mn ? company.ebitda_2024_usd_mn * 1_000_000 : null}
            />

            {/* AI Company Card Section */}
            {analysisGenerating && !analysis?.business_overview ? (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-accent">Generating AI Company Card</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Researching company data from multiple sources. This may take 1-2 minutes...
                  </p>
                </div>
              </div>
            ) : analysis?.status === 'failed' ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-12 flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-destructive">Analysis Failed</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysis.error_message || 'An error occurred while generating the analysis.'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={regenerateAnalysis} disabled={analysisGenerating}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : analysis?.status === 'completed' ? (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 space-y-6">
                <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-semibold text-accent">AI Company Card</h3>
                    <span className="text-xs text-muted-foreground ml-2">AI-generated analysis</span>
                  </div>
                  {analysis.sources && Array.isArray(analysis.sources) && analysis.sources.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Sources:</span>
                        {(analysis.sources as AnalysisSource[]).map((source, idx) => (
                          source.url ? (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors"
                            >
                              <Globe className="h-3 w-3" />
                              {source.title || new URL(source.url).hostname}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs"
                            >
                              {source.type === 'database' ? (
                                <FileText className="h-3 w-3" />
                              ) : source.type === 'inven' ? (
                                <Search className="h-3 w-3" />
                              ) : source.type === 'meeting_notes' ? (
                                <FileText className="h-3 w-3" />
                              ) : (
                                <Globe className="h-3 w-3" />
                              )}
                              {source.title || source.type}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Business Overview */}
                <CompanyAnalysisSection
                  title="Business Overview"
                  description="Establish a factual baseline: products, end markets, customer types, and geographic footprint."
                  icon={Building2}
                  content={analysis.business_overview || ''}
                  colorVariant="default"
                />

                {/* Business Model & Value Chain Summary */}
                <CompanyAnalysisSection
                  title="Business Model & Value Chain Summary"
                  description="Explain how the company operates economically and where it sits in the industry value chain."
                  icon={Briefcase}
                  content={analysis.business_model_summary || ''}
                  colorVariant="teal"
                />

                {/* Key Takeaways */}
                <CompanyAnalysisSection
                  title="Key Takeaways"
                  description="Surface the most important implications from the analysis above (3-5 synthesized insights)."
                  icon={Lightbulb}
                  content={analysis.key_takeaways || ''}
                  colorVariant="blue"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Investment Highlights */}
                  <CompanyAnalysisSection
                    title="Investment Highlights"
                    description="Identify upside drivers linked to the company's business model and positioning."
                    icon={TrendingUp}
                    content={analysis.investment_highlights || ''}
                    colorVariant="green"
                  />

                  {/* Investment Risks */}
                  <CompanyAnalysisSection
                    title="Investment Risks"
                    description="Identify risks inherent to the company's business model and value chain."
                    icon={AlertTriangle}
                    content={analysis.investment_risks || ''}
                    colorVariant="amber"
                  />
                </div>

                {/* Diligence Priorities */}
                <CompanyAnalysisSection
                  title="Diligence Priorities"
                  description="Define the most critical unknowns to resolve before advancing investment (3-7 items)."
                  icon={Search}
                  content={analysis.diligence_priorities || ''}
                  colorVariant="rose"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-12 flex flex-col items-center justify-center gap-4">
                <Sparkles className="h-10 w-10 text-accent/50" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-muted-foreground">No AI Analysis Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click &quot;AI Company Card&quot; to generate a comprehensive analysis using AI.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  onClick={generateAnalysis}
                  disabled={analysisGenerating}
                >
                  <Sparkles className="h-4 w-4" />
                  Generate AI Company Card
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="filters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">L1 Screening Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Vision Fit (≥25% revenue alignment)</span>
                      <p className="text-xs text-muted-foreground">Revenue from priority segments meets threshold</p>
                    </div>
                    {getL1StatusIcon(company.l1_vision_fit)}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Priority Geography (≥50% revenue)</span>
                      <p className="text-xs text-muted-foreground">Revenue from target geographies</p>
                    </div>
                    {getL1StatusIcon(company.l1_priority_geo_flag)}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">EV Below Threshold (&lt;$1B)</span>
                      <p className="text-xs text-muted-foreground">Enterprise value within investment range</p>
                    </div>
                    {getL1StatusIcon(company.l1_ev_below_threshold)}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Revenue Stability (No consecutive drops)</span>
                      <p className="text-xs text-muted-foreground">Revenue growth pattern check</p>
                    </div>
                    {getL1StatusIcon(company.l1_revenue_no_consecutive_drop_usd)}
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-medium">Overall L1 Result</span>
                      <p className="text-xs text-muted-foreground">Combined screening outcome</p>
                    </div>
                    {getL1StatusIcon(company.l1_screening_result)}
                  </div>
                  
                  {company.l1_rationale && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Rationale</p>
                      <p className="text-sm">{company.l1_rationale}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={addNote} disabled={isSubmitting || !newNote.trim()} size="sm">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Note
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.created_at && formatDistanceToNow(new Date(note.created_at), { addSuffix: true })} · {note.stage}
                        </p>
                      </div>
                    ))}
                    {notes.length === 0 && <p className="text-muted-foreground text-sm">No notes yet</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Links Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                    />
                    <Input
                      placeholder="Title (optional)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                    />
                    <Button onClick={addLink} disabled={isSubmitting || !newLinkUrl.trim()} size="sm">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Link
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline text-sm truncate flex-1"
                        >
                          <ExternalLink className="h-4 w-4 shrink-0" />
                          {link.title || link.url}
                        </a>
                        <Button variant="ghost" size="icon" onClick={() => deleteLink(link.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {links.length === 0 && <p className="text-muted-foreground text-sm">No links yet</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload a document</p>
                      </div>
                    </Label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate" title={doc.file_name}>
                            {doc.file_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadDocument(doc)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenPreview(doc)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc)} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {documents.length === 0 && <p className="text-muted-foreground text-sm">No documents yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document preview dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="truncate">{previewDoc?.file_name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            {loadingPreview ? (
              <div className="flex h-[400px] w-full items-center justify-center bg-muted/30 rounded-md border">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : previewUrl && previewDoc ? (
              <FilePreview
                url={previewUrl}
                fileName={previewDoc.file_name}
                onDownload={() => downloadDocument(previewDoc)}
              />
            ) : (
              <div className="flex h-[400px] w-full items-center justify-center bg-muted/30 rounded-md border text-muted-foreground">
                Preview not available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
