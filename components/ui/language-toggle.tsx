'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
      className="h-9 px-3 gap-2"
    >
      <Languages className="h-4 w-4" />
      <span className="font-medium">
        {language === 'en' ? 'EN' : 'JP'}
      </span>
      <span className="text-xs text-muted-foreground">
        {language === 'en' ? '→ 日本語' : '→ English'}
      </span>
    </Button>
  );
}