'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, FileStack } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { cn } from '@/lib/utils';

export default function AIDiscovery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to AI File Dump if someone lands here with ?tab=filedump
  useEffect(() => {
    if (searchParams.get('tab') === 'filedump') {
      router.replace('/ai-file-dump', { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen p-6">
        {/* Header - Legal Brain Assistant */}
        <div className="relative mb-6 flex-shrink-0">
          <div className="absolute -inset-2 rounded-2xl opacity-20 blur-xl transition-colors duration-500 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="relative flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl blur-md opacity-60 group-hover:opacity-80 transition-opacity bg-gradient-to-br from-emerald-400 to-teal-600" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600">
                <Sparkles className="h-7 w-7 text-white drop-shadow-lg" />
                <div
                  className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-emerald-400"
                  style={{ animationDuration: '3s' }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Legal Brain Assistant
                </h1>
                <Badge
                  variant="secondary"
                  className="text-xs font-medium px-2 py-0.5 border-0 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Document analysis
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Analyze documents, cross-check Aktas, search the web, and get company details
              </p>
            </div>
          </div>
        </div>

        {/* Legal Brain / AI File Dump tabs */}
        <div className="inline-flex w-fit mb-4 bg-muted/50 p-1 rounded-lg">
          <Link
            href="/ai-discovery"
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
              "bg-emerald-500/15 text-emerald-600 shadow-sm"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Legal Brain
          </Link>
          <Link
            href="/ai-file-dump"
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
              "text-teal-400/70 hover:bg-teal-500/15 hover:text-teal-600 hover:shadow-sm"
            )}
          >
            <FileStack className="h-4 w-4" />
            AI File Dump
          </Link>
        </div>

        {/* Chat */}
        <Card className="flex-1 flex flex-col overflow-hidden bg-muted/30 min-h-0 rounded-2xl border shadow-sm">
          <div className="flex-1 flex flex-col min-h-0 relative">
            <ChatWindow
              endpoint="/api/legal-brain"
              emoji="⚖️"
              placeholder="Ask about documents, companies, or legal context... Attach a file with the 📎 button."
              emptyStateComponent={null}
            />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
