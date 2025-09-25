import { WeatherContext, LocationData, TemporalContext, ConversationContext } from './contextManager';

// Session-based context management for proper client-server sync
export interface WeatherSession {
  sessionId: string;
  context: WeatherContext;
  lastActivity: Date;
  expiresAt: Date;
}

// In-memory session store (in production, use Redis or database)
class SessionStore {
  private sessions = new Map<string, WeatherSession>();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createSession(initialContext?: Partial<WeatherContext>): WeatherSession {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const session: WeatherSession = {
      sessionId,
      context: {
        location: {
          current: null,
          recent: [],
          preferences: []
        },
        temporal: {
          currentTimeframe: 'current',
          targetDate: null,
          recentDates: []
        },
        conversation: {
          lastWeatherQuery: '',
          queryIntent: 'general',
          followUpContext: null,
          conversationFlow: []
        },
        preferences: {
          language: 'en',
          units: 'metric',
          detailLevel: 'detailed',
          favoriteLocations: []
        },
        session: {
          startTime: now.toISOString(),
          lastActivity: now.toISOString(),
          messageCount: 0
        },
        ...initialContext
      },
      lastActivity: now,
      expiresAt: new Date(now.getTime() + this.SESSION_TIMEOUT)
    };

    this.sessions.set(sessionId, session);
    console.log('🆕 Created new session:', sessionId);
    return session;
  }

  getSession(sessionId: string): WeatherSession | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.log('❌ Session not found:', sessionId);
      return null;
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      console.log('⏰ Session expired:', sessionId);
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  updateSession(sessionId: string, updates: Partial<WeatherContext>): WeatherSession | null {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Update context
    session.context = {
      ...session.context,
      ...updates,
      session: {
        ...session.context.session,
        lastActivity: new Date().toISOString(),
        messageCount: session.context.session.messageCount + 1
      }
    };

    session.lastActivity = new Date();
    session.expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);

    console.log('🔄 Updated session:', sessionId);
    return session;
  }

  updateLocation(sessionId: string, location: LocationData): WeatherSession | null {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    // Update location context
    const updatedContext: Partial<WeatherContext> = {
      location: {
        current: location,
        recent: [
          location,
          ...session.context.location.recent.filter(
            loc => !(loc.city === location.city && loc.country === location.country)
          )
        ].slice(0, 5), // Keep only 5 recent locations
        preferences: session.context.location.preferences
      }
    };

    return this.updateSession(sessionId, updatedContext);
  }

  updateTemporal(sessionId: string, timeframe: TemporalContext['currentTimeframe'], targetDate?: string): WeatherSession | null {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    const updatedContext: Partial<WeatherContext> = {
      temporal: {
        currentTimeframe: timeframe,
        targetDate: targetDate || null,
        recentDates: targetDate ? [
          { date: targetDate, type: timeframe as 'historical' | 'forecast', lastUsed: new Date().toISOString() },
          ...session.context.temporal.recentDates.filter(d => d.date !== targetDate)
        ].slice(0, 10) : session.context.temporal.recentDates
      }
    };

    return this.updateSession(sessionId, updatedContext);
  }

  updateConversation(sessionId: string, query: string, intent: ConversationContext['queryIntent']): WeatherSession | null {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    const updatedContext: Partial<WeatherContext> = {
      conversation: {
        lastWeatherQuery: query,
        queryIntent: intent,
        followUpContext: null,
        conversationFlow: [
          ...session.context.conversation.conversationFlow,
          {
            type: 'intent' as const,
            value: intent,
            timestamp: new Date().toISOString()
          }
        ].slice(-20) // Keep only last 20 flow items
      }
    };

    return this.updateSession(sessionId, updatedContext);
  }

  // Cleanup expired sessions
  cleanup(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  // Get session stats
  getStats(): { totalSessions: number; activeSessions: number } {
    const now = new Date();
    let activeSessions = 0;

    for (const session of this.sessions.values()) {
      if (now <= session.expiresAt) {
        activeSessions++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions
    };
  }
}

// Singleton session store
export const sessionStore = new SessionStore();

// Cleanup expired sessions every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    sessionStore.cleanup();
  }, 60 * 60 * 1000);
}

// Context resolution with session
export function resolveContextWithSession(
  sessionId: string, 
  query: string, 
  language: string = 'en'
): {
  session: WeatherSession | null;
  needsLocationInput: boolean;
  needsTimeInput: boolean;
  contextualQuery: string;
} {
  const session = sessionStore.getSession(sessionId);
  
  // Check for basic location indicators (not exhaustive - let OpenAI handle the heavy lifting)
  const hasLocationIndicators = language === 'ja'
    ? /の天気|で|に/.test(query) || query.length > 10 // Japanese location patterns or longer queries
    : /in |at |for |weather/.test(query.toLowerCase()) || query.length > 10; // English patterns or longer queries

  console.log('🔍 Checking for location indicators in query:', query);
  console.log('🔍 Has location indicators:', hasLocationIndicators);
  
  if (!session) {
    // For new sessions, be more permissive - let OpenAI determine if location is present
    // Only ask for location if query is very short and has no location indicators
    const needsLocationInput = !hasLocationIndicators && query.trim().length < 8;
    return {
      session: null,
      needsLocationInput,
      needsTimeInput: false,
      contextualQuery: query
    };
  }

  const context = session.context;
  // For existing sessions, only need location input if no indicators AND no stored location
  const needsLocationInput = !hasLocationIndicators && !context.location.current;
  const needsTimeInput = false; // Default to current time

  // Create enhanced query with context
  let contextualQuery = query;
  if (!hasExplicitLocation && context.location.current) {
    contextualQuery = language === 'ja' 
      ? `${context.location.current.city}の${query}`
      : `${query} in ${context.location.current.city}`;
  }

  return {
    session,
    needsLocationInput,
    needsTimeInput,
    contextualQuery
  };
}