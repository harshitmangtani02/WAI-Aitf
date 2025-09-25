'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { WeatherData } from '@/lib/weather';
import { Mic, MicOff, Send, Zap } from 'lucide-react';

interface ChatInterfaceProps {
  weatherData?: WeatherData;
}

export function ChatInterface({ weatherData }: ChatInterfaceProps) {
  const { language, t } = useLanguage();
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [currentWeatherData, setCurrentWeatherData] = useState<WeatherData | undefined>(weatherData);
  const [apiStats, setApiStats] = useState<{ calls: number; time: number } | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

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

      try {
        const startTime = Date.now();
        
        const response = await fetch('/api/chat', {
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
            content: responseData.response || responseData
          };

          setMessages(prev => [...prev, assistantMessage]);
          
          // Update API stats
          const apiCalls = responseData.toolUsed ? 2 : 1; // Tool call = 2 OpenAI calls, direct = 1
          setApiStats({ calls: apiCalls, time: responseTime });
          
          console.log('📊 API Stats:', { calls: apiCalls, time: responseTime, toolUsed: responseData.toolUsed });
          
          // Update weather data if provided
          if (responseData.weatherData) {
            setCurrentWeatherData(responseData.weatherData);
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
        setInputValue('');
      }
    }
  }, [inputValue, messages, language]);

  const onVoiceResult = useCallback(async (transcript: string) => {
    console.log('Voice result received:', transcript);
    console.log('Current language:', language);

    // Simple voice processing - let OpenAI handle the context
    // Check if the transcript contains a location request (both Japanese and English)
    const locationMatch = language === 'ja'
      ? transcript.match(/(.+?)(?:の天気|の気候|天気|の天候)/i)
      : transcript.match(/(?:weather (?:in|for)|what.?s the weather (?:in|like in|for)|tell me the weather (?:in|for)) (.+?)(?:\?|$|please|today)?/i);

    console.log('Location match:', locationMatch);

    // If we found a location in voice, optionally fetch weather for it
    if (locationMatch && locationMatch[1]) {
      const location = locationMatch[1].trim();
      console.log('Voice detected location:', location);
      // Let the optimized API handle this through tool calling
    }

    // Set the transcript as input
    console.log('Setting transcript as input:', transcript);
    setInputValue(transcript);
  }, [setInputValue, language]);

  const {
    isListening,
    isSupported,
    error: voiceError,
    transcript,
    startListening,
    stopListening
  } = useVoiceInput({
    onResult: onVoiceResult,
    language: language
  });

  // Update input value with real-time transcript
  useEffect(() => {
    if (isListening && transcript) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);


  const handleVoiceToggle = () => {
    console.log('Voice toggle clicked, isListening:', isListening);
    console.log('isSupported:', isSupported);
    console.log('voiceError:', voiceError);

    if (isListening) {
      console.log('Stopping voice recognition...');
      stopListening();
    } else {
      console.log('Starting voice recognition...');
      startListening();
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Weather Card */}
      {/* {currentWeatherData && (
        <Card className="glass animate-float shadow-xl border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="relative">
                <MapPin className="w-6 h-6 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping"></div>
              </div>
              {currentWeatherData.city}, {currentWeatherData.country}
            </CardTitle>
            <CardDescription className="text-base">
              {t('currentWeather')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-primary mb-1">{currentWeatherData.temperature}°C</div>
                <div className="text-sm text-muted-foreground capitalize">{currentWeatherData.description}</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl font-semibold text-blue-500 mb-1">{currentWeatherData.humidity}%</div>
                <div className="text-sm text-muted-foreground">{t('humidity')}</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl font-semibold text-green-500 mb-1">{currentWeatherData.windSpeed} m/s</div>
                <div className="text-sm text-muted-foreground">{t('windSpeed')}</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl font-semibold text-purple-500 mb-1">{currentWeatherData.precipitation}mm</div>
                <div className="text-sm text-muted-foreground">Precipitation</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl font-semibold text-orange-500 mb-1">{currentWeatherData.cloudCover}%</div>
                <div className="text-sm text-muted-foreground">Cloud Cover</div>
              </div>
              <div className="text-center group hover:scale-105 transition-transform">
                <div className="text-xl font-semibold text-red-500 mb-1">{currentWeatherData.uvIndex}</div>
                <div className="text-sm text-muted-foreground">UV Index</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Chat Messages */}
      <Card className="glass shadow-xl border-secondary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              {t('assistantTitle')}
            </div>
            {/* {apiStats && (
              <div className="text-sm font-normal text-muted-foreground">
                {apiStats.calls} API call{apiStats.calls > 1 ? 's' : ''} • {apiStats.time}ms
              </div>
            )} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={chatContainerRef}
            className="space-y-6 min-h-[500px] max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/50 dark:scrollbar-thumb-gray-600/50 p-6"
          >
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-16">
                <div className="animate-bounce mb-6">
                  <span className="text-8xl">👋</span>
                </div>
                <h3 className="text-2xl font-semibold mb-6 text-foreground">{t('welcomeTitle')}</h3>
                <p className="text-lg mb-8 max-w-md mx-auto">{t('welcomeMessage')}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <span className="px-4 py-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-full text-sm font-medium shadow-lg">{t('exampleQueries.weather')}</span>
                  <span className="px-4 py-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-full text-sm font-medium shadow-lg">{t('exampleQueries.fashion')}</span>
                  <span className="px-4 py-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-full text-sm font-medium shadow-lg">{t('exampleQueries.travel')}</span>
                  <span className="px-4 py-2 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full text-sm font-medium shadow-lg">
                    {language === 'ja' ? 'バラナシの天気' : 'Varanasi weather'}
                  </span>
                  <span className="px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full text-sm font-medium shadow-lg">
                    {language === 'ja' ? '明日の東京' : 'Tokyo tomorrow'}
                  </span>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[80%] ${message.role === 'user'
                    ? 'bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-lg shadow-primary/20'
                    : 'bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-lg'
                    } rounded-2xl p-5`}
                  style={message.role === 'user' ? { color: 'var(--foreground)' } : {}}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center shadow-inner">
                          <span className="text-sm">👤</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center shadow-inner">
                          <span className="text-sm">🤖</span>
                        </div>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap flex-1 leading-relaxed">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-lg rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center shadow-inner">
                      <span className="text-sm">🤖</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-muted-foreground font-medium">{t('thinking')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card className="glass shadow-xl border-accent/20 sticky bottom-4">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder={t('inputPlaceholder')}
                disabled={isLoading || isLoadingWeather}
                className="h-14 text-base bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 shadow-inner focus:shadow-lg focus:ring-2 focus:ring-primary/50 transition-all duration-200 pr-16"
              />
              {isListening && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-red-500 rounded animate-pulse"></div>
                    <div className="w-1 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-5 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-4 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}
            </div>

            {isSupported && (
              <Button
                type="button"
                onClick={handleVoiceToggle}
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                disabled={isLoading || isLoadingWeather}
                className={`h-14 w-14 relative shadow-lg ${isListening
                  ? 'bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm border border-red-400/50 shadow-red-500/25 animate-pulse'
                  : 'bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20 hover:scale-105'
                  } transition-all duration-200`}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
                {isListening && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full animate-ping"></div>
                )}
              </Button>
            )}

            <Button
              type="submit"
              disabled={isLoading || isLoadingWeather || !inputValue?.trim()}
              size="icon"
              className="h-14 w-14 bg-primary/80 hover:bg-primary/90 backdrop-blur-sm border border-primary/50 shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 text-primary-foreground"
            >
              <Send className="w-6 h-6" />
            </Button>
          </form>

          {voiceError && (
            <div className="mt-4 p-4 bg-red-500/10 dark:bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-xl shadow-inner">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2 font-medium">
                <span>⚠️</span>
                <span>{t('voiceError')}: {voiceError}</span>
              </p>
            </div>
          )}

          {!isSupported && (
            <div className="mt-4 p-4 bg-amber-500/10 dark:bg-amber-500/5 backdrop-blur-sm border border-amber-500/20 rounded-xl shadow-inner">
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2 font-medium">
                <span>ℹ️</span>
                <span>{t('voiceNotSupported')}</span>
              </p>
            </div>
          )}

          {isListening && (
            <div className="mt-4 p-4 bg-green-500/10 dark:bg-green-500/5 backdrop-blur-sm border border-green-500/20 rounded-xl shadow-inner animate-pulse">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                <span>{t('listening')}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
