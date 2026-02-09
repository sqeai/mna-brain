import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Sparkles,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  Globe,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

interface MarketScreeningResult {
  id: string;
  target: string | null;
  segment: string | null;
  company_focus: string | null;
  website: string | null;
  revenue_2024_usd_mn: number | null;
  ev_2024: number | null;
  pipeline_stage: string;
  created_at: string;
  remarks: string | null;
}

interface MarketScreeningDetailDialogProps {
  result: MarketScreeningResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MarketScreeningDetailDialog({
  result,
  open,
  onOpenChange,
}: MarketScreeningDetailDialogProps) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Building2 className="h-6 w-6" />
            {result.target}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline">{result.segment || 'Unknown Sector'}</Badge>
            <Badge variant="secondary">AI Discovered</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Company Overview */}
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
                    <p className="font-semibold text-lg">{result.target}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <p className="font-medium">{result.segment || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <Badge variant="secondary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Discovery
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    {result.website ? (
                      <a
                        href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <Globe className="h-4 w-4" />
                        {result.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not available</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Discovered</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(result.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Focus */}
          {result.company_focus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Company Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{result.company_focus}</p>
              </CardContent>
            </Card>
          )}

          {/* Remarks */}
          {result.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Thesis Cross-Match Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20">
                  <p className="text-sm leading-relaxed">{result.remarks}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Revenue 2024 (USD Mn)</span>
                  </div>
                  <p className="text-2xl font-semibold font-mono text-primary">
                    {result.revenue_2024_usd_mn != null ? `$${result.revenue_2024_usd_mn.toFixed(1)}M` : '-'}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Enterprise Value 2024</span>
                  </div>
                  <p className="text-2xl font-semibold font-mono text-primary">
                    {result.ev_2024 != null ? `$${result.ev_2024.toFixed(1)}M` : '-'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * These are AI-generated estimates and should be verified during due diligence
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
