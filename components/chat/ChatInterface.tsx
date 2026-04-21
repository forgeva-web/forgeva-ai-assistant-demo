// @/components/chat/ChatInterface.tsx
'use client';
/*
    #TODO: Implement the ChatInterface component
    - Display the chat interface
    - Handle the chat interface
    - Handle the chat interface
*/
import { useState } from 'react';

import { useChat } from '@ai-sdk/react';
import { useUser } from '@clerk/nextjs';
import { DefaultChatTransport } from 'ai';

import { SEOAuditCard } from '@/components/chat/SEOAuditCard';
import { SeoAuditResult } from '@/components/chat/SEOAuditCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// import { parts } from 'ai';

export function ChatInterface({ siteId }: { siteId: string }) {
  const { isSignedIn, isLoaded } = useUser();
  const canAct = isLoaded && isSignedIn;

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { siteId },
    }),
  });

  const [input, setInput] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const isLoading = status === 'streaming' || status === 'submitted';
  const isError = status === 'error';

  return (
    <div className="space-y-2">
      {/* Status Badge — top right */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Ask about this site using its indexed content.
        </p>
        <Badge
          variant="outline"
          className={
            isLoading
              ? 'border-warning/30 bg-warning/10 text-warning'
              : isError
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-success/30 bg-success/10 text-success'
          }
        >
          {isLoading ? 'Thinking...' : isError ? 'Error' : 'Ready'}
        </Badge>
      </div>

      {/* Message Feed */}
      <div
        className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Ask for SEO analysis, content improvements, or page suggestions.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-xl p-3 text-sm shadow-sm ${
              message.role === 'user'
                ? // User bubble uses primary color — visually distinct from AI
                  'ml-auto max-w-[90%] bg-primary text-primary-foreground'
                : 'mr-auto max-w-[90%] border border-border bg-card text-foreground'
            }`}
          >
            {message.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return <p key={i}>{part.text}</p>;

                case 'tool-analyzeSEO': {
                  const callId = part.toolCallId;
                  switch (part.state) {
                    case 'input-available':
                      // Defensive extraction — verify the shape before using it
                      const input = part.input as Record<string, unknown>;
                      const pageUrl =
                        typeof input?.pageUrl === 'string'
                          ? input.pageUrl
                          : 'uknown page';
                      return (
                        <div
                          key={callId}
                          className="mt-2 flex items-center gap-2 text-xs text-warning"
                        >
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-warning border-t-transparent" />
                          Analyzing {pageUrl}...
                        </div>
                      );
                    case 'output-available':
                      return (
                        <div key={callId} className="mt-2">
                          <SEOAuditCard
                            result={part.output as SeoAuditResult}
                          />
                        </div>
                      );
                    case 'output-error':
                      return (
                        <div
                          key={callId}
                          className="mt-2 rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive"
                        >
                          <Alert variant="destructive">
                            <AlertDescription className="text-xs text-destructive-foreground">
                              Error: {part.errorText}
                            </AlertDescription>
                          </Alert>
                        </div>
                      );
                    default:
                      return null;
                  }
                }

                default:
                  return null;
              }
            })}
          </div>
        ))}
      </div>

      {/* Animated typing indicator while AI respondse */}
      {isLoading && (
        <div className="mr-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="inline-flex gap-1">
            <span className="h-1.25 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay: -0.2s]" />
            <span className="h-1.25 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay: -0.1s]" />
            <span className="h-1.25 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
          </span>
          AI is thinking...
        </div>
      )}

      {/* Error Alert W/ Retry */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription className="flex item-center gap-2">
            Request failed.
            {lastPrompt && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs underline text-destructive"
                onClick={() => sendMessage({ text: lastPrompt })}
              >
                Retry last message
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Input form — no HTML form elt, using div + onClick per shadcn patterns */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyDown={(e) => {
              // Allow Enter to submit w/out a form elt
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const trimmed = input.trim();
                if (!trimmed) {
                  setInputError('Please enter a message.');
                  return;
                }
                setInputError(null);
                setLastPrompt(trimmed);
                sendMessage({ text: trimmed });
                setInput('');
              }
            }}
            disabled={isLoading || !canAct}
            placeholder="Ask about this site..."
            aria-invalid={!!inputError}
            className={
              inputError
                ? 'border-destructive focus-visible:ring-destructive'
                : ''
            }
          />
          <Button
            disabled={isLoading || !canAct}
            aria-busy={isLoading}
            onClick={() => {
              const trimmed = input.trim();
              if (!trimmed) {
                setInputError('Please enter a message.');
                return;
              }
              setInputError(null);
              setLastPrompt(trimmed);
              sendMessage({ text: trimmed });
              setInput('');
            }}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/50 border-t-primary-foreground" />
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </Button>
        </div>
        {inputError && <p className="text-xs text-destructive">{inputError}</p>}
      </div>
    </div>
  );
}
