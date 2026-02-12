"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ArrowDown, LoaderCircle, Trash2, Send, Lightbulb, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatMessageBubble, LoadingBubble } from "./ChatMessageBubble";

const STORAGE_KEY = "legal-brain-chat-history";

const WELCOME_MESSAGE = `# Legal Brain Assistant

I help you analyze documents and answer legal and deal-related questions.

---

🔍 **Web search** – Regulations, company news, public records  
📄 **Akta cross-check** – Verify documents against internal company data  
🏢 **Company details** – Look up companies and financials  

You can **attach a file** (PDF, DOCX, etc.) in the chatbox and I’ll analyze it and cross-check when needed.

---

💡 **Try:**  
• Attach a contract or Akta and ask me to cross-check it  
• "Get company details for [Company Name]"  
• "Search for recent M&A regulation in Indonesia"  
• "Cross-check this document against our records"`;

const welcomeUIMessage: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [{ type: "text", text: WELCOME_MESSAGE }],
};

function WelcomeMessage() {
  return <ChatMessageBubble message={welcomeUIMessage} />;
}

function ChatMessages(props: {
  messages: ReturnType<typeof useChat>["messages"];
  emptyStateComponent: ReactNode;
  aiEmoji?: string;
  className?: string;
  isLoading?: boolean;
  onClearHistory?: () => void;
}) {
  return (
    <div className="w-full min-w-0">
      {/* Clear History Button - Sticky */}
      {props.messages.length > 0 && props.onClearHistory && (
        <div className="sticky top-2 z-20 flex justify-end pb-2 pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onClearHistory}
            className="ml-auto text-muted-foreground hover:text-destructive gap-1.5 bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </Button>
        </div>
      )}
      <div className="flex flex-col min-w-0 max-w-[768px] mx-auto pb-12 w-full">
        <WelcomeMessage />
        {props.messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} aiEmoji={props.aiEmoji} />
        ))}
        {props.isLoading && <LoadingBubble />}
      </div>
    </div>
  );
}

const SUGGESTION_CHIPS = [
  "Cross-check this document against our company records",
  "Get company details for this company",
  "Search for recent M&A regulation",
];

const CHAT_INPUT_PLACEHOLDER =
  "Ask about documents, companies, or legal context... You can attach a file below.";

const ACCEPTED_FILE_TYPES =
  "application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.txt,text/plain,application/json,.json,text/csv,.csv";

export function ChatInput(props: {
  onSubmit: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  suggestionChips?: string[];
  onChipClick?: (chip: string) => void;
  className?: string;
  /** Display name of attached file */
  attachedFileName?: string | null;
  /** Called when user selects a file; parent should store base64 + metadata for send */
  onFileSelect?: (file: { base64: string; fileName: string; mimeType: string }) => void;
  onClearFile?: () => void;
  /** Optional ref to read attached file at send time (for transport body) */
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const chips = props.suggestionChips ?? SUGGESTION_CHIPS;
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !props.onFileSelect) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (base64) props.onFileSelect({ base64, fileName: file.name, mimeType: file.type || "application/octet-stream" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit();
      }}
      className={cn("w-full space-y-3", props.className)}
    >
      <div className="flex gap-2 items-center">
        <input
          ref={hiddenInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={handleFileChange}
          aria-label="Attach file"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 h-10 w-10"
          onClick={() => hiddenInputRef.current?.click()}
          disabled={props.loading}
          title="Attach file (PDF, DOCX, TXT, etc.)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder ?? CHAT_INPUT_PLACEHOLDER}
          className="flex-1"
          disabled={props.loading}
        />
        <Button
          type="submit"
          disabled={(!props.value.trim() && !props.attachedFileName) || props.loading}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shrink-0"
        >
          {props.loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {props.attachedFileName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">📎 {props.attachedFileName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={props.onClearFile}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span>Try:</span>
        {chips.map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => props.onChipClick?.(chip)}
            className="text-primary hover:underline"
          >
            &quot;{chip}&quot;{i < chips.length - 1 ? "," : ""}
          </button>
        ))}
      </div>
    </form>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("rounded-full h-8 w-8 p-0 opacity-80 hover:opacity-100", props.className)}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={cn("grid grid-rows-[1fr,auto] overflow-y-auto", props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ChatLayout(props: {
  content: ReactNode;
  footer: ReactNode;
  contentClassName?: string;
  footerClassName?: string;
}) {
  const footerContent = (
    <>
      <ScrollToBottom className="absolute -top-10 left-1/2 -translate-x-1/2 mb-4" />
      {props.footer}
    </>
  );
  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName={cn("py-8 px-4 sm:px-6", props.contentClassName)}
        content={props.content}
        footer={
          props.footerClassName ? (
            <div className={cn("sticky bottom-0 flex-shrink-0", props.footerClassName)}>
              {footerContent}
            </div>
          ) : (
            <div className="sticky bottom-0 px-2 pb-4 pt-4 bg-gradient-to-t from-background via-background to-transparent">
              {footerContent}
            </div>
          )
        }
      />
    </StickToBottom>
  );
}

// Load messages from localStorage
function loadMessagesFromStorage(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load chat history:", e);
  }
  return [];
}

// Save messages to localStorage
function saveMessagesToStorage(messages: UIMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
}

type AttachedFilePayload = { base64: string; fileName: string; mimeType: string } | null;

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
  contentClassName?: string;
  footerClassName?: string;
}) {
  const [input, setInput] = useState("");
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const attachedFileRef = useRef<AttachedFilePayload>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: props.endpoint,
        body: () => {
          const file = attachedFileRef.current;
          return file ? { attachedFile: file } : {};
        },
      }),
    [props.endpoint]
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError: (e: Error) => {
      console.error(e);
      toast.error(`Error while processing your request`, {
        description: e.message,
      });
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

  const handleClearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Chat history cleared");
  }, [setMessages]);

  const handleFileSelect = useCallback((file: { base64: string; fileName: string; mimeType: string }) => {
    attachedFileRef.current = file;
    setAttachedFileName(file.fileName);
  }, []);

  const handleClearFile = useCallback(() => {
    attachedFileRef.current = null;
    setAttachedFileName(null);
  }, []);

  const handleSubmit = useCallback(() => {
    const text = input.trim() || (attachedFileName ? `[Attached: ${attachedFileName}]` : "");
    if (!text && !attachedFileRef.current) return;
    sendMessage({ text: text || "Please analyze the attached document." });
    setInput("");
    attachedFileRef.current = null;
    setAttachedFileName(null);
  }, [input, attachedFileName, sendMessage]);

  if (!isHydrated) return null;

  return (
    <ChatLayout
      contentClassName={props.contentClassName}
      footerClassName={props.footerClassName ?? "border-t bg-card p-4 flex-shrink-0"}
      content={
        messages.length === 0 ? (
          <div className="flex flex-col min-w-0 max-w-[768px] mx-auto pb-12 w-full">
            <WelcomeMessage />
          </div>
        ) : (
          <ChatMessages
            aiEmoji={props.emoji}
            messages={messages}
            emptyStateComponent={props.emptyStateComponent}
            isLoading={status === "submitted"}
            onClearHistory={handleClearHistory}
          />
        )
      }
      footer={
        <div className="max-w-5xl mx-auto space-y-3">
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSubmit={handleSubmit}
            loading={status === "streaming" || status === "submitted"}
            placeholder={props.placeholder ?? CHAT_INPUT_PLACEHOLDER}
            suggestionChips={SUGGESTION_CHIPS}
            onChipClick={(chip) => setInput(chip)}
            attachedFileName={attachedFileName}
            onFileSelect={handleFileSelect}
            onClearFile={handleClearFile}
          />
        </div>
      }
    />
  );
}
