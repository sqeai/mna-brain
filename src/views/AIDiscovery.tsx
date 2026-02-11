'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, FileStack, Lightbulb, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChatWindow } from '@/components/chat/ChatWindow';

// Define initial message manually to match structure
const initialMessages: any[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: `# Welcome to M&A AI Discovery

I'm your intelligent M&A assistant powered by AI. I can help you explore and analyze company data from your database.

## What I can do:

1. **Query companies** - Search by segment, geography, financials
2. **Get statistics** - Summaries, averages, breakdowns by segment/geography  
3. **Company details** - Detailed profiles with historical financials
4. **Web search** - Market benchmarks, industry comparisons, external data

## Example questions:

- "Show me all technology companies"
- "What are the top companies by 2024 revenue?"
- "Find companies in Japan with EBITDA > 50M"
- "Get statistics by segment"
- "Tell me about [company name]"
- "What are typical EBITDA multiples in this industry?"

Just ask your question and I'll analyze the data for you!`
      }
    ],
  },
];

const suggestionChips = [
  "show all companies",
  "get statistics by segment",
  "find companies with revenue > 100M",
];

export default function AIDiscovery() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen p-6">
        {/* Header */}
        <div className="relative mb-6 flex-shrink-0">
          <div className="absolute -inset-2 rounded-2xl opacity-20 blur-xl transition-colors duration-500 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
          <div className="relative flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl blur-md opacity-60 group-hover:opacity-80 transition-opacity bg-gradient-to-br from-purple-400 to-violet-600" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600">
                <Bot className="h-7 w-7 text-white drop-shadow-lg" />
                <div 
                  className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-purple-400" 
                  style={{ animationDuration: '3s' }} 
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  AI CoPilot
                </h1>
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium px-2 py-0.5 border-0 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Discover targets, analyze companies, compare synergies, and track pipeline
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="inline-flex h-10 items-center justify-center rounded-md text-muted-foreground w-fit mb-4 bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => router.push('/ai-discovery')}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 bg-purple-500/15 text-purple-600 shadow-sm transition-all"
          >
            <Sparkles className="h-4 w-4" />
            AI CoPilot
          </button>
          <button
            type="button"
            onClick={() => router.push('/ai-file-dump')}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 text-teal-400/70 hover:text-teal-600 transition-all"
          >
            <FileStack className="h-4 w-4" />
            AI File Dump
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden bg-background rounded-xl border border-border shadow-sm flex flex-col relative">
          <ChatWindow
            endpoint="/api/chat"
            emoji="🤖"
            placeholder="Ask about companies, analysis, comparisons..."
            emptyStateComponent={
              <div className="flex flex-col items-center justify-center h-full sm:p-8 p-4 text-center mt-12">
                {/* <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Try:</span>
                  {suggestionChips.map((chip, i) => (
                    <span
                      key={i}
                      className="bg-muted px-2 py-1 rounded-md border border-border"
                    >
                      &quot;{chip}&quot;
                    </span>
                  ))}
                </div> */}
              </div>
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
