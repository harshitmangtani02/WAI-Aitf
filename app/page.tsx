'use client';

import { ChatInterface } from '@/components/ChatInterface';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Dynamic Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>

        {/* Animated particles - visible in both light and dark mode */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-400/10 dark:to-purple-400/10 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-xl opacity-80 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-green-400/20 to-cyan-400/20 dark:from-green-400/10 dark:to-cyan-400/10 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-xl opacity-80 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-br from-pink-400/20 to-orange-400/20 dark:from-pink-400/10 dark:to-orange-400/10 rounded-full mix-blend-normal dark:mix-blend-screen filter blur-xl opacity-80 animate-blob animation-delay-4000"></div>
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob "></div>
        </div>

        <div className="relative z-10 container mx-auto py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-sm font-medium text-primary">{t('heroTagline')}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 pb-5 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-gradient">
              {t('heroTitle')}
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-card border">
                <span className="text-2xl">🗣️</span>
                <span className="text-sm font-medium">{t('voiceSupport')}</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-card border">
                <span className="text-2xl">🌤️</span>
                <span className="text-sm font-medium">{t('realTimeWeather')}</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-card border">
                <span className="text-2xl">🤖</span>
                <span className="text-sm font-medium">{t('aiSuggestions')}</span>
              </div>
            </div>
          </div>

          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
