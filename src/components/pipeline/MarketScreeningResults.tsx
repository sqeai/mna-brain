import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, ExternalLink, Sparkles, Trash2, Calendar } from 'lucide-react';
import MarketScreeningDetailDialog from './MarketScreeningDetailDialog';
import { formatDistanceToNow } from 'date-fns';

interface MarketScreeningResult {
  id: string;
  target: string | null;
  segment: string | null;
  website: string | null;
  pipeline_stage: string;
  created_at: string;
  thesis_content: string | null;
  remarks: string | null;

  // Extended fields
  segment_related_offerings: string | null;
  company_focus: string | null;
  ownership: string | null;
  geography: string | null;

  // Revenue (USD Mn)
  revenue_2021_usd_mn: number | null;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;

  // EBITDA (USD Mn)
  ebitda_2021_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;

  // Valuation
  ev_2024: number | null;
  ev_ebitda_2024: number | null;

  // Growth metrics
  revenue_cagr_2021_2022: number | null;
  revenue_cagr_2022_2023: number | null;
  revenue_cagr_2023_2024: number | null;

  // Margins
  ebitda_margin_2021: number | null;
  ebitda_margin_2022: number | null;
  ebitda_margin_2023: number | null;
  ebitda_margin_2024: number | null;
}

interface MarketScreeningResultsProps {
  refreshTrigger: number;
  onAddedToPipeline: () => void;
}

export default function MarketScreeningResults({ refreshTrigger, onAddedToPipeline }: MarketScreeningResultsProps) {
  const [results, setResults] = useState<MarketScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedResult, setSelectedResult] = useState<MarketScreeningResult | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('pipeline_stage', 'market_screening')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults((data || []) as MarketScreeningResult[]);
    } catch (error: any) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [refreshTrigger]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === results.length && results.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  };

  const isAllSelected = () => {
    return results.length > 0 && selectedIds.size === results.length;
  };

  const addToL0 = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one company');
      return;
    }

    setAdding(true);
    try {
      const selectedResults = results.filter(r => selectedIds.has(r.id));

      for (const result of selectedResults) {
        // Promote company from market_screening to L0 pipeline stage
        const { error: updateError } = await supabase
          .from('companies')
          .update({ pipeline_stage: 'L0' })
          .eq('id', result.id);

        if (updateError) {
          console.error('Error promoting company to L0:', updateError);
          continue;
        }

        // Log the promotion
        await supabase.from('company_logs').insert({
          company_id: result.id,
          action: 'PROMOTED_FROM_MARKET_SCREENING_TO_L0',
        });
      }

      toast.success(`Added ${selectedResults.length} companies to L0`);
      setSelectedIds(new Set());
      fetchResults();
      onAddedToPipeline();
    } catch (error: any) {
      console.error('Error adding to L0:', error);
      toast.error('Failed to add companies to pipeline');
    } finally {
      setAdding(false);
    }
  };

  const dismissResult = async (id: string) => {
    try {
      await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      toast.success('Result dismissed');
      fetchResults();
    } catch (error: any) {
      console.error('Error dismissing result:', error);
      toast.error('Failed to dismiss result');
    }
  };

  if (loading) {
    return (
      <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Discovered Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Discovered Companies
          </CardTitle>
          <CardDescription>
            Companies matching your investment thesis will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mb-4 opacity-50" />
            <p>No companies discovered yet</p>
            <p className="text-sm">Configure your investment thesis and run a scan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI-Discovered Companies
            </CardTitle>
            <CardDescription>
              {results.length} companies matching your investment thesis
            </CardDescription>
          </div>
          <Button
            onClick={addToL0}
            disabled={adding || selectedIds.size === 0}
            className="bg-stage-l0 hover:bg-stage-l0/90"
          >
            {adding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to L0 ({selectedIds.size})
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Select All */}
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            checked={isAllSelected()}
            onCheckedChange={toggleSelectAll}
            id="select-all-results"
          />
          <label htmlFor="select-all-results" className="text-sm font-medium cursor-pointer">
            Select All
          </label>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Revenue 2024</TableHead>
                <TableHead>EV 2024</TableHead>
                <TableHead>Discovered</TableHead>
                <TableHead className="max-w-[200px]">Remarks</TableHead>
                <TableHead className="max-w-[150px]">Thesis</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(result.id)}
                      onCheckedChange={() => toggleSelect(result.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <button
                        onClick={() => {
                          setSelectedResult(result);
                          setDetailDialogOpen(true);
                        }}
                        className="font-medium text-left hover:text-primary hover:underline transition-colors"
                      >
                        {result.target}
                      </button>
                      {result.website && (
                        <a
                          href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {result.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{result.segment || 'Unknown'}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {result.revenue_2024_usd_mn != null ? `$${result.revenue_2024_usd_mn.toFixed(1)}M` : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {result.ev_2024 != null ? `$${result.ev_2024.toFixed(1)}M` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {result.remarks ? (
                      <p className="text-xs text-muted-foreground line-clamp-2" title={result.remarks}>
                        {result.remarks}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <p className="text-xs text-muted-foreground truncate" title={result.thesis_content || ''}>
                      {result.thesis_content ? result.thesis_content.substring(0, 50) + '...' : '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissResult(result.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <MarketScreeningDetailDialog
          result={selectedResult}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </CardContent>
    </Card>
  );
}
