import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  Upload,
  Plus,
  Loader2,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
  Expand,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Search,
  Briefcase,
  Globe,
} from 'lucide-react';
import { CompanyAnalysisSection } from '@/components/pipeline/CompanyAnalysisSection';
import { DealStage, L1Status } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CompanyData {
  id: string;
  target: string | null;
  segment: string | null;
  watchlist_status: string | null;
  pipeline_stage: string | null;
  revenue_2021_usd_mn: number | null;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;
  ebitda_2021_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;
  ev_2024: number | null;
  l1_screening_result: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface StageHistory {
  id: string;
  stage: string;
  entered_at: string;
  exited_at: string | null;
  duration_seconds: number | null;
}

interface DealNote {
  id: string;
  content: string;
  stage: string;
  created_at: string;
}

interface DealLink {
  id: string;
  url: string;
  title: string | null;
  stage: string;
  created_at: string;
}

interface DealDocument {
  id: string;
  file_name: string;
  file_path: string;
  stage: string;
  created_at: string;
}

interface Screening {
  id: string;
  company_id: string;
  criteria_id: string;
  state: 'pending' | 'completed' | 'failed';
  result: string | null;
  remarks: string | null;
  created_at: string;
  criterias: {
    id: string;
    name: string;
    prompt: string;
  };
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

interface CompanyDetailDialogProps {
  company: CompanyData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(0)}`;
};

const formatDuration = (seconds: number | null) => {
  if (seconds === null) return 'Ongoing';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export default function CompanyDetailDialog({
  company,
  open,
  onOpenChange,
  onUpdate,
}: CompanyDetailDialogProps) {
  const router = useRouter();
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [links, setLinks] = useState<DealLink[]>([]);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);

  // Analysis states
  const [analysis, setAnalysis] = useState<CompanyAnalysis | null>(null);
  const [analysisGenerating, setAnalysisGenerating] = useState(false);

  // Form states
  const [newNote, setNewNote] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDetails();
      fetchAnalysis();
    }
  }, [open, company.id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [historyRes, notesRes, linksRes, docsRes, screeningsRes] = await Promise.all([
        supabase
          .from('deal_stage_history')
          .select('*')
          .eq('deal_id', company.id)
          .order('entered_at', { ascending: false }),
        supabase
          .from('deal_notes')
          .select('*')
          .eq('deal_id', company.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_links')
          .select('*')
          .eq('deal_id', company.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_documents')
          .select('*')
          .eq('deal_id', company.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('screenings')
          .select(`
            *,
            criterias (
              id,
              name,
              prompt
            )
          `)
          .eq('company_id', company.id)
          .order('created_at', { ascending: false }),
      ]);

      if (historyRes.data) setStageHistory(historyRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      if (linksRes.data) setLinks(linksRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      if (screeningsRes.data) setScreenings(screeningsRes.data as Screening[]);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const res = await fetch(`/api/company-analysis?companyId=${company.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
        if (data.status === 'generating') {
          setAnalysisGenerating(true);
          pollAnalysis();
        }
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const pollAnalysis = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/company-analysis?companyId=${company.id}`);
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
    setTimeout(() => {
      clearInterval(interval);
      setAnalysisGenerating(false);
    }, 300000);
  };

  const generateAnalysis = async () => {
    setAnalysisGenerating(true);
    try {
      const res = await fetch('/api/company-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id }),
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
      fetchAnalysis();
    } finally {
      setAnalysisGenerating(false);
    }
  };

  const regenerateAnalysis = async () => {
    try {
      await fetch(`/api/company-analysis?companyId=${company.id}`, {
        method: 'DELETE',
      });
      setAnalysis(null);
    } catch {
      // Continue even if delete fails
    }
    await generateAnalysis();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('deal_notes').insert({
        deal_id: company.id,
        content: newNote,
        stage: company.pipeline_stage || 'L0',
      });
      if (error) throw error;
      setNewNote('');
      fetchDetails();
      toast.success('Note added');
    } catch (error: any) {
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLink = async () => {
    if (!newLinkUrl.trim()) return;
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
      fetchDetails();
      toast.success('Link added');
    } catch (error: any) {
      toast.error('Failed to add link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      const filePath = `${company.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('deal_documents').insert({
        deal_id: company.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        stage: company.pipeline_stage || 'L0',
      });

      if (dbError) throw dbError;

      fetchDetails();
      toast.success('Document uploaded');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
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
      await supabase.storage.from('deal-documents').remove([doc.file_path]);
      await supabase.from('deal_documents').delete().eq('id', doc.id);
      fetchDetails();
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const downloadDocument = async (doc: DealDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('deal-documents')
        .download(doc.file_path);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => {
            onOpenChange(false);
            router.push(`/pipeline/${company.id}`);
          }}
          className="absolute right-10 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title="Open full page"
        >
          <Expand className="h-4 w-4" />
          <span className="sr-only">Open full page</span>
        </button>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Building2 className="h-6 w-6" />
            {company.target || 'Unknown Company'}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2">
              {company.segment && <Badge variant="outline">{company.segment}</Badge>}
              {company.watchlist_status && (
                <Badge variant={company.watchlist_status === 'Active' ? 'default' : 'secondary'}>
                  {company.watchlist_status}
                </Badge>
              )}
              <Badge variant="secondary">{company.pipeline_stage || 'L0'}</Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between gap-2">
            <TabsList className="grid grid-cols-6 flex-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="company-card">Company Card</TabsTrigger>
              <TabsTrigger value="filters">L1 Filters</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shrink-0"
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
          </div>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Company Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="font-semibold text-lg">{company.target || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Segment</p>
                      <p className="font-medium">{company.segment || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {company.watchlist_status ? (
                        <Badge variant={company.watchlist_status === 'Active' ? 'default' : 'secondary'}>
                          {company.watchlist_status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Pipeline Stage</p>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {company.pipeline_stage || 'L0'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Enterprise Value (2024)</p>
                      <p className="font-semibold text-2xl text-primary">{formatCurrency(company.ev_2024)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">L1 Screening Result</p>
                      {company.l1_screening_result ? (
                        <Badge variant={company.l1_screening_result.toLowerCase() === 'pass' ? 'default' : 'destructive'}>
                          {company.l1_screening_result}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not screened yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Remarks */}
                {company.remarks && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">AI Remarks (Thesis Cross-Match)</p>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{company.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Revenue (USD Millions)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { year: '2022', revenue: company.revenue_2022_usd_mn || 0 },
                        { year: '2023', revenue: company.revenue_2023_usd_mn || 0 },
                        { year: '2024', revenue: company.revenue_2024_usd_mn || 0 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" className="text-sm" />
                      <YAxis
                        tickFormatter={(value) => `$${value.toFixed(0)}M`}
                        className="text-sm"
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(1)}M`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        name="Revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* EBITDA Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  EBITDA (USD Millions)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { year: '2022', ebitda: company.ebitda_2022_usd_mn || 0 },
                        { year: '2023', ebitda: company.ebitda_2023_usd_mn || 0 },
                        { year: '2024', ebitda: company.ebitda_2024_usd_mn || 0 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" className="text-sm" />
                      <YAxis
                        tickFormatter={(value) => `$${value.toFixed(0)}M`}
                        className="text-sm"
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(1)}M`, 'EBITDA']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar
                        dataKey="ebitda"
                        fill="hsl(142, 76%, 36%)"
                        radius={[4, 4, 0, 0]}
                        name="EBITDA"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* AI Company Card Summary in Overview */}
            {analysisGenerating && !analysis?.business_overview ? (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <div className="text-center">
                  <h3 className="text-base font-semibold text-accent">Generating AI Company Card</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Researching company data from multiple sources. This may take 1-2 minutes...
                  </p>
                </div>
              </div>
            ) : analysis?.status === 'failed' ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <div className="text-center">
                  <h3 className="text-base font-semibold text-destructive">Analysis Failed</h3>
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
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-semibold text-accent">AI Company Card</h3>
                    <span className="text-xs text-muted-foreground ml-2">AI-generated analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {analysis.updated_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(analysis.updated_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-accent hover:text-accent/80 text-xs h-7 px-2"
                      onClick={regenerateAnalysis}
                      disabled={analysisGenerating}
                    >
                      {analysisGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                </div>

                {analysis.sources && Array.isArray(analysis.sources) && analysis.sources.length > 0 && (
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
                )}

                <CompanyAnalysisSection
                  title="Business Overview"
                  description="Products, end markets, customer types, and geographic footprint."
                  icon={Building2}
                  content={analysis.business_overview || ''}
                  colorVariant="default"
                />

                <CompanyAnalysisSection
                  title="Business Model & Value Chain Summary"
                  description="How the company operates economically and its position in the value chain."
                  icon={Briefcase}
                  content={analysis.business_model_summary || ''}
                  colorVariant="teal"
                />

                <CompanyAnalysisSection
                  title="Key Takeaways"
                  description="The most important implications from the analysis (3-5 synthesized insights)."
                  icon={Lightbulb}
                  content={analysis.key_takeaways || ''}
                  colorVariant="blue"
                />

                <CompanyAnalysisSection
                  title="Investment Highlights"
                  description="Upside drivers linked to the company's business model and positioning."
                  icon={TrendingUp}
                  content={analysis.investment_highlights || ''}
                  colorVariant="green"
                />

                <CompanyAnalysisSection
                  title="Investment Risks"
                  description="Risks inherent to the company's business model and value chain."
                  icon={AlertTriangle}
                  content={analysis.investment_risks || ''}
                  colorVariant="amber"
                />

                <CompanyAnalysisSection
                  title="Diligence Priorities"
                  description="Critical unknowns to resolve before advancing investment (3-7 items)."
                  icon={Search}
                  content={analysis.diligence_priorities || ''}
                  colorVariant="rose"
                />
              </div>
            ) : null}

            {/* Stage History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Stage History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stageHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No history yet</p>
                ) : (
                  <div className="space-y-2">
                    {stageHistory.map((history) => (
                      <div key={history.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{history.stage}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(history.entered_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {history.exited_at
                            ? formatDuration(history.duration_seconds)
                            : 'Current'
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company-card" className="space-y-4 mt-4">
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
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-semibold text-accent">AI Company Card</h3>
                    <span className="text-xs text-muted-foreground ml-2">AI-generated analysis</span>
                  </div>
                  {analysis.updated_at && (
                    <span className="text-xs text-muted-foreground">
                      Last: {format(new Date(analysis.updated_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  )}
                </div>

                {analysis.sources && Array.isArray(analysis.sources) && analysis.sources.length > 0 && (
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
                )}

                <CompanyAnalysisSection
                  title="Business Overview"
                  description="Products, end markets, customer types, and geographic footprint."
                  icon={Building2}
                  content={analysis.business_overview || ''}
                  colorVariant="default"
                />

                <CompanyAnalysisSection
                  title="Business Model & Value Chain Summary"
                  description="How the company operates economically and its position in the value chain."
                  icon={Briefcase}
                  content={analysis.business_model_summary || ''}
                  colorVariant="teal"
                />

                <CompanyAnalysisSection
                  title="Key Takeaways"
                  description="The most important implications from the analysis (3-5 synthesized insights)."
                  icon={Lightbulb}
                  content={analysis.key_takeaways || ''}
                  colorVariant="blue"
                />

                <CompanyAnalysisSection
                  title="Investment Highlights"
                  description="Upside drivers linked to the company's business model and positioning."
                  icon={TrendingUp}
                  content={analysis.investment_highlights || ''}
                  colorVariant="green"
                />

                <CompanyAnalysisSection
                  title="Investment Risks"
                  description="Risks inherent to the company's business model and value chain."
                  icon={AlertTriangle}
                  content={analysis.investment_risks || ''}
                  colorVariant="amber"
                />

                <CompanyAnalysisSection
                  title="Diligence Priorities"
                  description="Critical unknowns to resolve before advancing investment (3-7 items)."
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

          <TabsContent value="filters" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">L1 Filter Results</CardTitle>
              </CardHeader>
              <CardContent>
                {screenings.length > 0 ? (
                  <div className="space-y-3">
                    {screenings.map((screening) => (
                      <div key={screening.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{screening.criterias?.name || 'Unknown Criteria'}</span>
                            <Badge
                              variant={screening.state === 'completed' ? 'outline' : screening.state === 'pending' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {screening.state}
                            </Badge>
                          </div>
                          {screening.result && (
                            <p className="text-sm text-muted-foreground mt-1">{screening.result}</p>
                          )}
                          {screening.remarks && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{screening.remarks}</p>
                          )}
                        </div>
                        <ScreeningStateIcon state={screening.state} result={screening.result} />
                      </div>
                    ))}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Overall Status</span>
                        <Badge variant={company.l1_screening_result?.toLowerCase() === 'pass' ? 'default' : 'destructive'}>
                          {company.l1_screening_result || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No screenings have been run yet. Click &quot;Screen&quot; from the L0 stage to run filters.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addNote} disabled={isSubmitting || !newNote.trim()}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                {notes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No notes yet</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(note.created_at), 'MMM d, yyyy HH:mm')} • {note.stage}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="URL"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                    />
                    <Input
                      placeholder="Title (optional)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                    />
                  </div>
                  <Button onClick={addLink} disabled={isSubmitting || !newLinkUrl.trim()} className="self-end">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                {links.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No links yet</p>
                ) : (
                  <div className="space-y-2">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {link.title || link.url}
                          </a>
                          <Badge variant="outline" className="text-xs">{link.stage}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteLink(link.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
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
                      <p className="text-sm text-muted-foreground">
                        Click to upload a document
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isSubmitting}
                  />
                </div>

                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No documents yet</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="text-primary hover:underline text-left"
                          >
                            {doc.file_name}
                          </button>
                          <Badge variant="outline" className="text-xs">{doc.stage}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FilterResult({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {passed ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Pass</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Fail</span>
        </div>
      )}
    </div>
  );
}

function ScreeningStateIcon({ state, result }: { state: 'pending' | 'completed' | 'failed'; result: string | null }) {
  if (state === 'pending') {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Pending</span>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <XCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Failed</span>
      </div>
    );
  }
  // For completed state, check the result
  const isPassed = result?.toLowerCase() === 'pass' || result?.toLowerCase() === 'yes';
  return (
    <div className={`flex items-center gap-1 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
      {isPassed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span className="text-sm font-medium">{isPassed ? 'Pass' : 'Fail'}</span>
    </div>
  );
}

