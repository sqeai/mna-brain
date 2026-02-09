import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Pencil, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  target?: string | null;
  segment?: string | null;
  geography?: string | null;
  company_focus?: string | null;
  ownership?: string | null;
  website?: string | null;
  revenue_2022_usd_mn?: number | null;
  revenue_2023_usd_mn?: number | null;
  revenue_2024_usd_mn?: number | null;
  ebitda_2022_usd_mn?: number | null;
  ebitda_2023_usd_mn?: number | null;
  ebitda_2024_usd_mn?: number | null;
  ev_2024?: number | null;
}



interface AIScreeningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onComplete: () => void;
}

interface Criteria {
  id: string;
  name: string;
  prompt: string;
}

export default function AIScreeningDialog({
  open,
  onOpenChange,
  companies,
  onComplete,
}: AIScreeningDialogProps) {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionPrompt, setNewCriterionPrompt] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isScreening, setIsScreening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch criteria from database on mount
  useEffect(() => {
    const fetchCriteria = async () => {
      setIsLoadingCriteria(true);
      try {
        const { data, error } = await supabase
          .from('criterias')
          .select('id, name, prompt')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setCriteria(data || []);
      } catch (error: any) {
        console.error('Error fetching criteria:', error);
        toast.error('Failed to load screening criteria');
      } finally {
        setIsLoadingCriteria(false);
      }
    };

    if (open) {
      fetchCriteria();
    }
  }, [open]);

  const addCriterion = async () => {
    if (!newCriterionName.trim() || !newCriterionPrompt.trim()) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('criterias')
        .insert({
          name: newCriterionName.trim(),
          prompt: newCriterionPrompt.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setCriteria([...criteria, data]);
      setNewCriterionName('');
      setNewCriterionPrompt('');
      toast.success('Criterion added');
    } catch (error: any) {
      console.error('Error adding criterion:', error);
      toast.error('Failed to add criterion');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCriterion = async (index: number) => {
    const criterionToDelete = criteria[index];

    try {
      const { error } = await supabase
        .from('criterias')
        .delete()
        .eq('id', criterionToDelete.id);

      if (error) throw error;

      setCriteria(criteria.filter((_, i) => i !== index));
      toast.success('Criterion deleted');
    } catch (error: any) {
      console.error('Error deleting criterion:', error);
      toast.error('Failed to delete criterion');
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(criteria[index].name);
    setEditPrompt(criteria[index].prompt);
  };

  const saveEdit = async () => {
    if (editingIndex === null || !editName.trim() || !editPrompt.trim()) return;

    const criterionToUpdate = criteria[editingIndex];
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('criterias')
        .update({
          name: editName.trim(),
          prompt: editPrompt.trim(),
        })
        .eq('id', criterionToUpdate.id);

      if (error) throw error;

      const newCriteria = [...criteria];
      newCriteria[editingIndex] = {
        ...criterionToUpdate,
        name: editName.trim(),
        prompt: editPrompt.trim(),
      };
      setCriteria(newCriteria);
      setEditingIndex(null);
      setEditName('');
      setEditPrompt('');
      toast.success('Criterion updated');
    } catch (error: any) {
      console.error('Error updating criterion:', error);
      toast.error('Failed to update criterion');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditName('');
    setEditPrompt('');
  };

  /**
   * Run a single screening API call with retry logic for rate limits and timeouts.
   * Retries up to MAX_RETRIES times with exponential backoff on:
   * - HTTP 429 (rate limit)
   * - HTTP 504 (gateway timeout / agent timeout)
   * - HTTP 500+ (transient server errors)
   * - Network/fetch errors
   */
  const callScreeningAPI = async (
    company: Company,
    criterion: Criteria,
    retryCount = 0
  ): Promise<{ result: string; remarks: string }> => {
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 5000; // 5s base delay for exponential backoff
    const companyName = company.target || company.name;

    let response: Response;
    try {
      response = await fetch('/api/ai-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          criteriaId: criterion.id,
          criteriaPrompt: criterion.prompt,
          company: {
            id: company.id,
            name: companyName,
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
          },
        }),
      });
    } catch (fetchError) {
      // Network error / fetch failure -- retry if attempts remain
      if (retryCount < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount);
        console.warn(
          `[AI-Screening] Network error for "${companyName}", criteria="${criterion.name}". ` +
          `Retry ${retryCount + 1}/${MAX_RETRIES} after ${delayMs / 1000}s`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return callScreeningAPI(company, criterion, retryCount + 1);
      }
      throw fetchError;
    }

    // Retry on rate limit (429), timeout (504), or server error (500+)
    const isRetryableStatus = response.status === 429 || response.status === 504 || response.status >= 500;
    if (isRetryableStatus && retryCount < MAX_RETRIES) {
      const retryAfter = response.headers.get('retry-after');
      // Use longer backoff for timeouts since the server was genuinely overloaded
      const baseForStatus = response.status === 504 ? BASE_DELAY_MS * 2 : BASE_DELAY_MS;
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : baseForStatus * Math.pow(2, retryCount); // e.g. timeout: 10s, 20s, 40s; rate limit: 5s, 10s, 20s
      const reason = response.status === 429 ? 'Rate limited' : response.status === 504 ? 'Timed out' : `Server error (${response.status})`;
      console.warn(
        `[AI-Screening] ${reason} for "${companyName}", criteria="${criterion.name}". ` +
        `Retry ${retryCount + 1}/${MAX_RETRIES} after ${delayMs / 1000}s`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callScreeningAPI(company, criterion, retryCount + 1);
    }

    const data = await response.json();

    // Check if the response body indicates a retriable error (rate limit or timeout mentioned in remarks)
    if (
      data.result === 'error' &&
      typeof data.remarks === 'string' &&
      (data.remarks.toLowerCase().includes('rate limit') || data.remarks.toLowerCase().includes('timed out')) &&
      retryCount < MAX_RETRIES
    ) {
      const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount);
      console.warn(
        `[AI-Screening] Retriable error for "${companyName}", criteria="${criterion.name}": ${data.remarks}. ` +
        `Retry ${retryCount + 1}/${MAX_RETRIES} after ${delayMs / 1000}s`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callScreeningAPI(company, criterion, retryCount + 1);
    }

    return data;
  };

  /**
   * Execute async tasks with a concurrency limit and stagger delay.
   * - maxConcurrent: max parallel tasks at any time
   * - staggerDelayMs: delay between launching each new task to avoid thundering herd
   */
  const runWithConcurrency = async <T,>(
    tasks: (() => Promise<T>)[],
    maxConcurrent: number,
    staggerDelayMs: number
  ): Promise<void> => {
    const executing = new Set<Promise<void>>();
    let launched = 0;

    for (const task of tasks) {
      // Stagger delay between launches to spread out API calls
      if (launched > 0) {
        await new Promise((resolve) => setTimeout(resolve, staggerDelayMs));
      }

      const p = task().then(() => {
        executing.delete(p);
      });
      executing.add(p);
      launched++;

      // If at max concurrency, wait for one to finish before launching next
      if (executing.size >= maxConcurrent) {
        await Promise.race(executing);
      }
    }

    // Wait for all remaining tasks to complete
    await Promise.all(executing);
  };

  const runScreening = async () => {
    if (criteria.length === 0) {
      toast.error('Please add at least one screening criterion');
      return;
    }

    if (companies.length === 0) {
      toast.error('No companies selected for screening');
      return;
    }

    setIsScreening(true);

    try {
      // Step 1: Batch create/update pending screening entries
      const companyIds = companies.map((c) => c.id);
      const criteriaIds = criteria.map((c) => c.id);
      const totalExpected = companies.length * criteria.length;
      console.log(`[AI-Screening] Creating ${totalExpected} screening entries (${companies.length} companies × ${criteria.length} criteria)`);

      // Fetch all existing screenings for these companies + criteria in one query
      const { data: existingScreenings } = await supabase
        .from('screenings')
        .select('id, company_id, criteria_id')
        .in('company_id', companyIds)
        .in('criteria_id', criteriaIds);

      const existingMap = new Map(
        (existingScreenings || []).map((s) => [`${s.company_id}:${s.criteria_id}`, s.id])
      );

      // Build upsert payload for all entries at once
      const upsertPayload = companies.flatMap((company) =>
        criteria.map((criterion) => {
          const existingId = existingMap.get(`${company.id}:${criterion.id}`);
          return {
            ...(existingId ? { id: existingId } : {}),
            company_id: company.id,
            criteria_id: criterion.id,
            state: 'pending' as const,
            result: null,
            remarks: null,
          };
        })
      );

      // Upsert all entries in a single DB call
      const { data: screeningEntries, error: upsertError } = await supabase
        .from('screenings')
        .upsert(upsertPayload, { onConflict: 'company_id,criteria_id' })
        .select('id, company_id, criteria_id');

      if (upsertError) {
        console.error('[AI-Screening] Upsert error:', upsertError);
        throw new Error('Failed to create screening entries');
      }

      const entries = screeningEntries || [];
      console.log(`[AI-Screening] Created ${entries.length} / ${totalExpected} screening entries`);

      toast.success(`Started AI screening for ${companies.length} companies with ${criteria.length} criteria`);

      // Close the dialog immediately - progress will be shown in Pipeline view
      onOpenChange(false);
      onComplete();

      // Step 2: Fire off AI API calls with concurrency limit in the background
      // Conservative concurrency to avoid Anthropic rate limits:
      // - MAX_CONCURRENT=2 means at most 2 agent invocations running in parallel
      // - Each agent invocation may make 2-5 Anthropic API calls (tool use rounds)
      // - STAGGER_DELAY=1500ms spreads out launches to avoid bursts
      // - The Anthropic SDK has built-in retry (maxRetries=2) for 429 errors
      // - Our callScreeningAPI adds application-level retry with exponential backoff on top
      const MAX_CONCURRENT = 2;
      const STAGGER_DELAY_MS = 1500; // 1.5s between launching each new task

      (async () => {
        const tasks = entries.map((entry) => async () => {
          const company = companies.find((c) => c.id === entry.company_id);
          const criterion = criteria.find((c) => c.id === entry.criteria_id);

          if (!company || !criterion) return;

          try {
            console.log(`[AI-Screening] Starting: company="${company.target || company.name}", criteria="${criterion.name}"`);
            const data = await callScreeningAPI(company, criterion);
            console.log(`[AI-Screening] Done: company="${company.target || company.name}", criteria="${criterion.name}" → ${data.result}`);

            // Update screening entry in database
            const newState = data.result === 'error' ? 'failed' : 'completed';
            await supabase
              .from('screenings')
              .update({
                state: newState,
                result: data.result,
                remarks: data.remarks,
              })
              .eq('id', entry.id);
          } catch (error) {
            console.error(`[AI-Screening] Failed: company="${company.target || company.name}", criteria="${criterion.name}":`, error);
            await supabase
              .from('screenings')
              .update({
                state: 'failed',
                result: 'error',
                remarks: 'API call failed after retries',
              })
              .eq('id', entry.id);
          }
        });

        console.log(`[AI-Screening] Running ${tasks.length} screenings with concurrency=${MAX_CONCURRENT}, stagger=${STAGGER_DELAY_MS}ms`);
        await runWithConcurrency(tasks, MAX_CONCURRENT, STAGGER_DELAY_MS);
        console.log(`[AI-Screening] All ${tasks.length} screening requests completed`);
      })();
    } catch (error: any) {
      console.error('Screening error:', error);
      toast.error(error.message || 'Failed to start AI screening');
    } finally {
      setIsScreening(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">AI Screening</DialogTitle>
              <DialogDescription>
                Configure screening criteria in natural language
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Criteria Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Screening Criteria</h3>
              <p className="text-sm text-muted-foreground">
                Define your criteria using Natural Language, AI will do the rest
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('new-criterion-input')?.focus()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New
            </Button>
          </div>

          {/* Criteria List */}
          <div className="space-y-3">
            {isLoadingCriteria ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading criteria...</span>
              </div>
            ) : criteria.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No screening criteria found. Add your first criterion below.
              </div>
            ) : (
              criteria.map((criterion, index) => (
                <div
                  key={criterion.id}
                  className="flex items-start gap-3 p-4 border rounded-lg bg-card"
                >
                  <Badge
                    variant="secondary"
                    className="shrink-0 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  >
                    {index + 1}
                  </Badge>

                  {editingIndex === index ? (
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Name</label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Criterion name"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Prompt</label>
                        <Input
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          placeholder="Screening prompt"
                          autoFocus
                          disabled={isSaving}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} disabled={isSaving || !editName.trim() || !editPrompt.trim()}>
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 pt-0.5">
                        <div className="font-medium text-sm">{criterion.name}</div>
                        <div className="text-muted-foreground text-sm">{criterion.prompt}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(index)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => deleteCriterion(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {/* Add New Criterion Input */}
            <div className="space-y-2 p-4 border rounded-lg border-dashed">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <Input
                  placeholder="e.g., Asia Revenue Check"
                  value={newCriterionName}
                  onChange={(e) => setNewCriterionName(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Prompt</label>
                <Input
                  id="new-criterion-input"
                  placeholder="e.g., Revenue contribution from Asia > 30%"
                  value={newCriterionPrompt}
                  onChange={(e) => setNewCriterionPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isSaving && addCriterion()}
                  disabled={isSaving}
                />
              </div>
              <Button onClick={addCriterion} disabled={!newCriterionName.trim() || !newCriterionPrompt.trim() || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Criterion'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {companies.length} companies selected, {criteria.length} criteria
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={runScreening}
              disabled={isScreening || isLoadingCriteria || criteria.length === 0}
              className="bg-gradient-to-r from-purple-600 to-purple-500"
            >
              {isScreening ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run AI Screening
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
