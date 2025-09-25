'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mic, Cloud } from 'lucide-react';

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Cloud className="h-8 w-8 text-primary animate-pulse" />
              <Mic className="absolute -top-1 -right-1 h-4 w-4 text-foreground animate-bounce" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {t('appTitle')}
              </h1>
              {/* <p className="text-sm text-muted-foreground">
                {t('appSubtitle')}
              </p> */}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            {/* <Palette className="h-4 w-4" /> */}
            <span>{t('headerTagline')}</span>
          </div>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Animated gradient line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>
    </header>
  );
}