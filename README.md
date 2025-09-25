# Weather Fashion Travel Chatbot / 天気ファッション・旅行チャットボット

A bilingual chatbot that combines weather data with AI-powered fashion and travel suggestions, featuring English and Japanese voice input support.

## ✨ Features

- 🌐 **Bilingual Support**: Complete English/Japanese language switching with instant UI translation
- 🗣️ **Multi-Language Voice Input**: Japanese (`ja-JP`) and English (`en-US`) speech recognition
- 🤖 **Language-Aware AI**: OpenAI GPT-3.5-turbo responds in the selected language without browser translation
- 🌤️ **Weather Integration**: Real-time weather data from OpenWeatherMap API
- 👗 **Fashion Suggestions**: AI-powered clothing recommendations based on weather
- 🧳 **Travel Recommendations**: Travel activity suggestions considering weather conditions
- 🎨 **Dynamic Modern UI**: Glassmorphism design with animations and theme switching
- 💬 **Enhanced Chat Interface**: Animated messages, loading states, and voice feedback
- 📱 **Fully Responsive**: Optimized for all screen sizes with smooth transitions
- 🌗 **Dark/Light Mode**: System-aware theme switching with smooth transitions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **AI Integration**: AI SDK with OpenAI GPT-3.5-turbo
- **Weather API**: OpenWeatherMap
- **Voice Input**: Web Speech API (supports both English and Japanese)
- **Internationalization**: Custom React Context with localStorage persistence
- **Styling**: Custom design system with CSS variables and animations

## 🚀 Setup Instructions

### 1. Clone the repository
```bash
git clone [repository-url]
cd weather-fashion-chatbot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

Required API keys:
- **OpenWeather API Key**: Get from [OpenWeatherMap](https://openweathermap.org/api) (free tier available)
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 🎯 Language Support

### Voice Recognition
- **Japanese**: Uses `ja-JP` locale for accurate Japanese speech recognition
- **English**: Uses `en-US` locale for English speech recognition
- **Automatic Language Detection**: Voice input automatically matches the selected UI language

### AI Responses
- **Context-Aware**: OpenAI GPT-3.5-turbo receives language context in system prompts
- **No Translation Dependencies**: Direct bilingual responses without browser translation
- **Cultural Sensitivity**: Responses adapt to Japanese vs Western cultural contexts

### UI Translation
- **Instant Switching**: Language toggle button in header for immediate UI changes
- **Persistent Selection**: Language preference saved to localStorage
- **Complete Coverage**: All text elements including error messages and placeholders

## 📱 Usage

### English Mode
1. **Text Input**: Type questions like "What's the weather in London?"
2. **Voice Input**: Click 🎤 and say "What should I wear in this weather?"
3. **Get Recommendations**: Receive AI-powered fashion and travel suggestions

### Japanese Mode (日本語モード)
1. **テキスト入力**: 「東京の天気はどうですか？」のように入力
2. **音声入力**: 🎤ボタンを押して「今日はどんな服を着ればいい？」と話す
3. **提案を受ける**: 天気に基づいたファッションと旅行の提案を取得

### Example Queries

**English:**
- "Tell me the weather in New York"
- "What should I wear for 15°C weather?"
- "Suggest indoor activities for a rainy day"

**Japanese:**
- "東京の天気を教えて"
- "今日の服装はどうすればいい？"
- "雨の日におすすめの場所は？"

## 🏗️ Architecture

### Language Management
```
contexts/LanguageContext.tsx - Language state management
├── Language detection and persistence
├── Translation function provider
└── Bilingual content management
```

### Voice Input System
```
hooks/useVoiceInput.ts - Multi-language voice recognition
├── Language-specific speech recognition setup
├── Error handling in user's language
└── Real-time audio feedback
```

### AI Integration
```
app/api/chat/route.ts - Bilingual AI responses
├── Dynamic system prompt generation
├── Language-aware response formatting
└── Weather data integration
```

## 🔧 Development

### Project Structure
```
├── app/
│   ├── api/chat/route.ts       # Bilingual AI chat endpoint
│   ├── api/weather/route.ts    # Weather API integration
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Main page with translations
├── components/
│   ├── ui/
│   │   ├── theme-toggle.tsx    # Dark/light mode switch
│   │   └── language-toggle.tsx # Language switch button
│   ├── Header.tsx              # Bilingual header component
│   └── ChatInterface.tsx       # Main chat with translations
├── contexts/
│   └── LanguageContext.tsx     # Language management system
└── hooks/
    └── useVoiceInput.ts        # Multi-language voice input
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 Browser Compatibility

### Voice Input Requirements
- **Recommended**: Chrome/Edge (full Web Speech API support)
- **Supported**: Safari (limited), Firefox (limited)
- **Languages**: Both Japanese and English recognition supported

### UI Compatibility
- **All Modern Browsers**: Complete UI and chat functionality
- **Mobile Responsive**: Touch-optimized interface
- **Accessibility**: Screen reader friendly with semantic HTML

## 🎨 Customization

### Adding New Languages
1. Update language types in `contexts/LanguageContext.tsx`
2. Add translations to the `translations` object
3. Update voice input locales in `hooks/useVoiceInput.ts`
4. Add language option to `components/ui/language-toggle.tsx`

### Theme Customization
- Modify CSS variables in `app/globals.css`
- Update design tokens for consistent theming
- Customize animations and transitions

## 📄 License

MIT License - Feel free to use and modify for your projects!

---

**Built with ❤️ using Next.js, OpenAI, and modern web technologies**