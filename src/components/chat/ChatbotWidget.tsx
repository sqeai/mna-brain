'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, Send, X, Maximize2, Minimize2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import CompanyDetailDialog, { type CompanyData } from '@/components/pipeline/CompanyDetailDialog';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'mna-chat-history';

function loadMessagesFromStorage(): UIMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load chat history:', e);
  }
  return [];
}

function saveMessagesToStorage(messages: UIMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save chat history:', e);
  }
}

function getTextFromUIMessage(m: UIMessage): string {
  const parts = (m as { parts?: Array<{ type: string; text?: string }> }).parts ?? [];
  return parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('');
}

const COMMON_WORDS = [
  'analyze', 'deep', 'dive', 'review', 'assessment', 'evaluate', 'compare',
  'vs', 'versus', 'synergy', 'synergies', 'find', 'show', 'list', 'discover', 'search',
  'companies', 'company', 'the', 'a', 'an', 'in', 'for', 'about', 'what', 'how', 'tell', 'me',
];

function extractPotentialCompanyNames(query: string): string[] {
  return query.split(/\s+/).filter(
    (word) => word.length > 2 && !COMMON_WORDS.includes(word.toLowerCase())
  );
}

export function ChatbotWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [matchedCompanyForLastUser, setMatchedCompanyForLastUser] = useState<{ name: string; id: string } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError: (e: Error) => {
      console.error(e);
      toast.error('Error while processing your request', { description: e.message });
    },
  });

  useEffect(() => {
    const stored = loadMessagesFromStorage();
    if (stored.length > 0) setMessages(stored);
    setIsHydrated(true);
  }, [setMessages]);

  useEffect(() => {
    if (isHydrated && messages.length > 0) saveMessagesToStorage(messages);
  }, [messages, isHydrated]);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, status]);

  const findCompanyInDatabase = async (query: string): Promise<{ name: string; id: string } | null> => {
    const names = extractPotentialCompanyNames(query);
    for (const name of names) {
      try {
        const { data } = await supabase
          .from('companies')
          .select('id, target')
          .ilike('target', `%${name}%`)
          .limit(1)
          .maybeSingle();
        if (data?.id && data?.target) return { name: data.target, id: data.id };
      } catch {
        // continue
      }
    }
    return null;
  };

  const fetchCompanyByName = async (companyName: string): Promise<CompanyData | null> => {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id, target, segment, watchlist_status,
        revenue_2021_usd_mn, revenue_2022_usd_mn, revenue_2023_usd_mn, revenue_2024_usd_mn,
        ebitda_2021_usd_mn, ebitda_2022_usd_mn, ebitda_2023_usd_mn, ebitda_2024_usd_mn,
        ev_2024, pipeline_stage, l1_screening_result, created_at, updated_at, remarks
      `)
      .ilike('target', `%${companyName}%`)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      target: data.target ?? null,
      segment: data.segment ?? null,
      watchlist_status: data.watchlist_status ?? null,
      pipeline_stage: data.pipeline_stage ?? null,
      revenue_2021_usd_mn: data.revenue_2021_usd_mn ?? null,
      revenue_2022_usd_mn: data.revenue_2022_usd_mn ?? null,
      revenue_2023_usd_mn: data.revenue_2023_usd_mn ?? null,
      revenue_2024_usd_mn: data.revenue_2024_usd_mn ?? null,
      ebitda_2021_usd_mn: data.ebitda_2021_usd_mn ?? null,
      ebitda_2022_usd_mn: data.ebitda_2022_usd_mn ?? null,
      ebitda_2023_usd_mn: data.ebitda_2023_usd_mn ?? null,
      ebitda_2024_usd_mn: data.ebitda_2024_usd_mn ?? null,
      ev_2024: data.ev_2024 ?? null,
      l1_screening_result: data.l1_screening_result ?? null,
      remarks: data.remarks ?? null,
      created_at: data.created_at ?? '',
      updated_at: data.updated_at ?? '',
    };
  };

  const [input, setInput] = useState('');
  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput('');
    findCompanyInDatabase(text).then(setMatchedCompanyForLastUser);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleViewCompanyDetails = async (companyName: string) => {
    const company = await fetchCompanyByName(companyName);
    if (company) {
      setSelectedCompany(company);
      setCompanyDialogOpen(true);
    } else {
      toast.error('Company not found');
    }
  };

  const handleExpand = () => {
    setIsOpen(false);
    router.push('/ai-discovery');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const showViewDetailsOnLastAssistant =
    lastMessage?.role === 'assistant' && matchedCompanyForLastUser;

  return (
    <>
      <Card
        className={cn(
          'fixed bottom-6 right-6 z-50 shadow-2xl border-purple-200 dark:border-purple-800/50 overflow-hidden transition-all duration-200',
          isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-medium">AI CoPilot</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleExpand}
              title="Open full AI Discovery"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <ScrollArea className="flex-1 h-[380px] p-4" ref={scrollRef}>
              {!isHydrated ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 rounded-xl px-3 py-2 text-sm bg-muted">
                        <MarkdownRenderer
                          content="Hi! I'm your M&A assistant. Ask about company discovery, deep dives, pipeline insights, or click ↗ to open full AI Discovery."
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const content = getTextFromUIMessage(msg);
                    const isLastAssistant = msg.id === lastMessage?.id && msg.role === 'assistant';
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex gap-3', isUser && 'flex-row-reverse')}
                      >
                        <div
                          className={cn(
                            'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
                            isUser ? 'bg-primary' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                          )}
                        >
                          {isUser ? (
                            <span className="text-xs text-primary-foreground font-medium">You</span>
                          ) : (
                            <Bot className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex-1 rounded-xl px-3 py-2 text-sm',
                            isUser
                              ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                              : 'bg-muted'
                          )}
                        >
                          {isUser ? (
                            <p>{content}</p>
                          ) : (
                            <>
                              <MarkdownRenderer content={content || '…'} className="text-sm" />
                              {isLastAssistant && matchedCompanyForLastUser && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-3 gap-2 text-xs"
                                  onClick={() => handleViewCompanyDetails(matchedCompanyForLastUser.name)}
                                >
                                  <Building2 className="h-3 w-3" />
                                  View {matchedCompanyForLastUser.name} Details
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isBusy && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-xl px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="border-t p-3">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1 text-sm"
                  disabled={isBusy}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isBusy}
                  size="icon"
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {selectedCompany && (
        <CompanyDetailDialog
          company={selectedCompany}
          open={companyDialogOpen}
          onOpenChange={setCompanyDialogOpen}
          onUpdate={() => {}}
        />
      )}
    </>
  );
}
