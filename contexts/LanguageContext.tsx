'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    appTitle: 'ATF Weather ChatBox',
    appSubtitle: 'Voice-Enabled AI Assistant',
    headerTagline: 'Harshit Mangtani',

    // Hero
    heroTagline: 'AI × Weather × Fashion',
    heroTitle: 'Intelligent Weather Assistant',
    heroSubtitle: 'Get weather updates with AI-powered fashion & travel recommendations through voice or text',
    voiceSupport: 'Voice Input Support',
    realTimeWeather: 'Real-time Weather',
    aiSuggestions: 'AI Recommendation Engine',

    // Weather Card
    currentWeather: '🌡️ Current Weather Information',
    humidity: '💧 Humidity',
    windSpeed: '💨 Wind Speed',

    // Chat
    assistantTitle: 'Weather Assistant',
    assistantDescription: '🎯 AI-powered fashion and travel suggestions based on weather',
    welcomeTitle: 'Hello!',
    welcomeMessage: "Let's get started via Voice/Text input whenever you're ready!!",
    exampleQueries: {
      weather: 'Weather in Tokyo',
      fashion: 'Clothing advice',
      travel: 'Travel conditions'
    },
    thinking: 'AI is thinking...',

    // Input
    inputPlaceholder: 'Type a message or use 🎤 for voice input...',
    listening: '🎤 Listening to your voice...',
    voiceNotSupported: 'ℹ️ Voice input is not supported in this browser',
    voiceError: '⚠️',

    // System
    systemPrompt: 'You are a helpful AI assistant specializing in fashion and travel recommendations based on weather conditions. Please respond in English and provide practical, stylish advice.'
  },
  ja: {
    // Header
    appTitle: '天気ファッション・旅行チャットボット',
    appSubtitle: '音声対応 AI アシスタント',
    headerTagline: 'ハーシット マングタニ',

    // Hero
    heroTagline: 'AI × 天気 × ファッション',
    heroTitle: 'インテリジェントウェザーアシスタント',
    heroSubtitle: '音声で簡単に天気を確認し、AIがあなたにぴったりのファッションと旅行を提案します',
    voiceSupport: '日本語音声対応',
    realTimeWeather: 'リアルタイム天気',
    aiSuggestions: 'AI提案エンジン',

    // Weather Card
    currentWeather: '🌡️ 現在の天気情報',
    humidity: '💧 湿度',
    windSpeed: '💨 風速',

    // Chat
    assistantTitle: '天気アシスタント',
    assistantDescription: '🎯 天気に基づいたファッションと旅行の提案をします',
    welcomeTitle: 'こんにちは！',
    welcomeMessage: '準備ができたら、音声/テキスト入力で始めましょう！！',
    exampleQueries: {
      weather: '東京の天気',
      fashion: '服装のアドバイス',
      travel: '旅行の条件'
    },
    thinking: 'AIが考えています...',

    // Input
    inputPlaceholder: 'メッセージを入力するか、🎤ボタンで音声入力...',
    listening: '🎤 音声を聞き取り中...',
    voiceNotSupported: 'ℹ️ 音声入力はこのブラウザではサポートされていません',
    voiceError: '⚠️',

    // System
    systemPrompt: 'あなたは天気に基づいたファッションと旅行の提案を専門とする親切なAIアシスタントです。日本語で回答し、実用的でスタイリッシュなアドバイスを提供してください。'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ja');

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('preferred-language') as Language;
    if (saved && (saved === 'en' || saved === 'ja')) {
      setLanguage(saved);
    }
  }, []);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('preferred-language', language);
  }, [language]);

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}