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
import { Bot, Send, X, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';

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

/** Hide THINKING_START/THINKING_END blocks; show only content after THINKING_END (matches full chat behavior). */
function scrubThinkingMarkers(text: string): string {
  const start = '<!-- THINKING_START -->';
  const end = '<!-- THINKING_END -->';
  const endIdx = text.indexOf(end);
  if (endIdx !== -1) return text.slice(endIdx + end.length).trim();
  const startIdx = text.indexOf(start);
  if (startIdx !== -1) return text.slice(0, startIdx).trim();
  return text;
}

export function ChatbotWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
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

  const [input, setInput] = useState('');
  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExpand = () => {
    setIsOpen(false);
    router.push('/ai-discovery');
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {/* Pulse rings */}
            <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
            <span className="absolute -inset-1 rounded-full bg-accent/20 animate-pulse" />
            <Button
              onClick={() => setIsOpen(true)}
              className="relative h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-accent to-purple-700 hover:from-purple-700 hover:to-accent border-2 border-white/20 transition-all duration-300 hover:scale-110 hover:shadow-accent/40 hover:shadow-2xl"
              size="icon"
            >
              <Sparkles className="h-6 w-6 text-white drop-shadow-lg" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
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
                    let content = getTextFromUIMessage(msg);
                    if (!isUser) content = scrubThinkingMarkers(content);
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
                            <MarkdownRenderer content={content || '…'} className="text-sm" />
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
      )}
    </>
  );
}
