'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

export function OptimizedChatInterface() {
  const { language, t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStats, setApiStats] = useState<{ calls: number; time: number } | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: inputValue.trim()
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      
      const startTime = Date.now();

      try {
        const response = await fetch('/api/chat-optimized', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            language: language
          }),
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
          const responseData = await response.json();
          
          const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant' as const,
            content: responseData.response
          };

          setMessages(prev => [...prev, assistantMessage]);
          
          // Update API stats
          const apiCalls = responseData.toolUsed ? 2 : 1; // Tool call = 2 OpenAI calls, direct = 1
          setApiStats({ calls: apiCalls, time: responseTime });
          
          console.log('📊 API Stats:', { calls: apiCalls, time: responseTime, toolUsed: responseData.toolUsed });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
        setInputValue('');
      }
    }
  }, [inputValue, messages, language]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            ⚡ Optimized Weather Chat (Tool Calling)
            {apiStats && (
              <span className="text-sm font-normal text-green-600">
                {apiStats.calls} API call{apiStats.calls > 1 ? 's' : ''} • {apiStats.time}ms
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <div className="space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold mb-2">Optimized Weather Assistant</h3>
                <p className="text-sm">Try: "Tokyo weather", "Varanasi tomorrow", "London yesterday"</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-green-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">
                      {message.role === 'user' ? '👤' : '⚡'}
                    </span>
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚡</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about weather (e.g., Tokyo weather, Varanasi tomorrow)"
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}