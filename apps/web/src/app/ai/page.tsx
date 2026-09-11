'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Send, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToaster } from '@/components/toaster-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('codex-auth');
  const res = await fetch(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default function AIPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToaster();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const { data: conversations } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => fetchWithAuth('/api/ai/conversations'),
  });

  const askMutation = useMutation({
    mutationFn: async (msg: string) => {
      const token = localStorage.getItem('codex-auth');
      const res = await fetch(`${API_URL}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg,
          conversationId,
          context: { includeMarketData: true, includePortfolio: true },
        }),
      });
      if (!res.ok) throw new Error('Failed to get AI response');
      return res.json();
    },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message.content }]);
      setMessage('');
    },
    onError: () => {
      addToast({ title: 'Error', description: 'Failed to get AI response', variant: 'error' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    askMutation.mutate(message);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Codex AI</h1>
        <p className="text-muted-foreground mt-1">Your intelligent trading assistant</p>
      </div>

      <div className="inline-block bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-medium">
        AI ANALYSIS IS INFORMATIONAL AND BASED ON SIMULATED/DEMO MARKET DATA
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-96 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p>Ask Codex AI about market analysis, portfolio insights, or trading concepts.</p>
                <p className="text-sm mt-2">This is a simulated demo environment.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {askMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about markets, portfolio, or trading..."
              disabled={askMutation.isPending}
            />
            <Button type="submit" disabled={!message.trim() || askMutation.isPending}>
              <Send size={16} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}