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
import { Loader2, Plus, Zap, Target, Sparkles, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import CompanyDetailDialog from './CompanyDetailDialog';
import { cn } from '@/lib/utils';
import { DealStage } from '@/lib/types';

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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  // Check if value is in Millions (since data is _usd_mn)
  // If the value is stored as millions (e.g. 10.5 for $10.5M), we format directly
  // Adjust logic if data is raw numbers. Based on field name `_usd_mn`, it's likely in millions.

  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  return `$${value.toFixed(1)}M`;
};

export default function MarketScreeningResults({ refreshTrigger, onAddedToPipeline, collapsed = false, onToggleCollapse }: MarketScreeningResultsProps) {
  const [results, setResults] = useState<MarketScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedResult, setSelectedResult] = useState<MarketScreeningResult | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
      const { error } = await supabase
        .from('companies')
        .update({ pipeline_stage: 'L0' })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      // Log actions
      const logs = Array.from(selectedIds).map(id => ({
        company_id: id,
        action: 'PROMOTED_FROM_MARKET_SCREENING_TO_L0',
      }));

      await supabase.from('company_logs').insert(logs);

      toast.success(`Added ${selectedIds.size} companies to L0`);
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

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (!sortField) return 0;

    let aVal: any = 0;
    let bVal: any = 0;

    switch (sortField) {
      case 'target':
        aVal = (a.target || '').toLowerCase();
        bVal = (b.target || '').toLowerCase();
        break;
      case 'segment':
        aVal = (a.segment || '').toLowerCase();
        bVal = (b.segment || '').toLowerCase();
        break;
      case 'revenue_2023':
        aVal = a.revenue_2023_usd_mn || 0;
        bVal = b.revenue_2023_usd_mn || 0;
        break;
      case 'revenue_2024':
        aVal = a.revenue_2024_usd_mn || 0;
        bVal = b.revenue_2024_usd_mn || 0;
        break;
      case 'revenue_2025':
        aVal = 0;
        bVal = 0;
        break;
      case 'valuation':
        aVal = a.ev_2024 || 0;
        bVal = b.ev_2024 || 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const ModernHeader = ({ showDescription = false }: { showDescription?: boolean }) => (
    <CardHeader className="pb-4 relative">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 group-hover:scale-105",
              "bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500"
            )}>
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-2xl bg-purple-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-bold tracking-tight bg-gradient-to-r from-purple-700 via-violet-600 to-fuchsia-600 dark:from-purple-300 dark:via-violet-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
                AI-Discovered Companies
              </CardTitle>
              <Badge variant="outline" className="bg-purple-100/80 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-[10px] px-2 py-0.5 h-5">
                <Zap className="h-2.5 w-2.5 mr-1" />
                AI Powered
              </Badge>
            </div>
            <CardDescription>
              {showDescription ? "Companies matching your investment thesis will appear here" : `${results.length} companies matching your investment thesis`}
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle button */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              {collapsed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {collapsed ? 'Show' : 'Hide'}
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          )}

          {!collapsed && (
            <Button
              onClick={addToL0}
              disabled={adding || selectedIds.size === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all active:scale-95"
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
          )}
        </div>
      </div>
    </CardHeader>
  );

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 via-violet-50/30 to-fuchsia-50/20 dark:from-purple-950/30 dark:via-violet-950/20 dark:to-fuchsia-950/10 shadow-lg shadow-purple-500/5">
        <ModernHeader />
        {!collapsed && (
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 via-violet-50/30 to-fuchsia-50/20 dark:from-purple-950/30 dark:via-violet-950/20 dark:to-fuchsia-950/10 shadow-lg shadow-purple-500/5">
        <ModernHeader showDescription />
        {!collapsed && (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="relative mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-200 to-violet-200 dark:from-purple-800/50 dark:to-violet-800/50">
                  <Sparkles className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                </div>
              </div>
              <p className="font-medium">No companies discovered yet</p>
              <p className="text-sm">Configure your investment thesis and run a scan</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  // Helper for sorting buttons
  const SortButton = ({ field, label, align = "left" }: { field: string, label: string, align?: "left" | "right" }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        "flex items-center hover:text-foreground transition-colors group",
        align === "right" && "justify-end w-full"
      )}
    >
      {label}
      <span className="ml-1 text-muted-foreground/50 group-hover:text-foreground/80">
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </button>
  );

  return (
    <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 via-violet-50/30 to-fuchsia-50/20 dark:from-purple-950/30 dark:via-violet-950/20 dark:to-fuchsia-950/10 shadow-lg shadow-purple-500/5">
      <ModernHeader />

      <CardContent>
        {!collapsed && (
          <>
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead><SortButton field="target" label="Company" /></TableHead>
                    <TableHead><SortButton field="segment" label="Sector" /></TableHead>
                    <TableHead>PIC</TableHead>
                    <TableHead className="text-right"><SortButton field="revenue_2023" label="Rev 2023" align="right" /></TableHead>
                    <TableHead className="text-right"><SortButton field="revenue_2024" label="Rev 2024" align="right" /></TableHead>
                    <TableHead className="text-right"><SortButton field="revenue_2025" label="Rev 2025" align="right" /></TableHead>
                    <TableHead className="text-right">EBITDA 2023</TableHead>
                    <TableHead className="text-right">EBITDA 2024</TableHead>
                    <TableHead className="text-right">EBITDA 2025</TableHead>
                    <TableHead className="text-right"><SortButton field="valuation" label="Valuation" align="right" /></TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((result) => (
                    <TableRow key={result.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(result.id)}
                          onCheckedChange={() => toggleSelect(result.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <button
                            onClick={() => {
                              setSelectedResult(result);
                              setDetailDialogOpen(true);
                            }}
                            className="font-medium text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          >
                            {result.target}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{result.segment || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(result.revenue_2023_usd_mn)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(result.revenue_2024_usd_mn)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        -
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(result.ebitda_2023_usd_mn)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(result.ebitda_2024_usd_mn)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        -
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium text-foreground">
                        {formatCurrency(result.ev_2024)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissResult(result.id)}
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedResult && (
              <CompanyDetailDialog
                company={{
                  id: selectedResult.id,
                  target: selectedResult.target,
                  segment: selectedResult.segment,
                  watchlist_status: null,
                  pipeline_stage: selectedResult.pipeline_stage as DealStage,
                  revenue_2021_usd_mn: selectedResult.revenue_2021_usd_mn,
                  revenue_2022_usd_mn: selectedResult.revenue_2022_usd_mn,
                  revenue_2023_usd_mn: selectedResult.revenue_2023_usd_mn,
                  revenue_2024_usd_mn: selectedResult.revenue_2024_usd_mn,
                  ebitda_2021_usd_mn: selectedResult.ebitda_2021_usd_mn,
                  ebitda_2022_usd_mn: selectedResult.ebitda_2022_usd_mn,
                  ebitda_2023_usd_mn: selectedResult.ebitda_2023_usd_mn,
                  ebitda_2024_usd_mn: selectedResult.ebitda_2024_usd_mn,
                  ev_2024: selectedResult.ev_2024,
                  l1_screening_result: null,
                  remarks: selectedResult.remarks,
                  created_at: selectedResult.created_at,
                  updated_at: selectedResult.created_at,
                }}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                onUpdate={fetchResults}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
