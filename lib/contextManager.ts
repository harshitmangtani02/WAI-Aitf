export interface LocationData {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    confidence?: number;
    lastUsed?: string;
}

export interface TemporalContext {
    currentTimeframe: 'current' | 'historical' | 'forecast';
    targetDate: string | null;
    recentDates: Array<{
        date: string;
        type: 'historical' | 'forecast';
        lastUsed: string;
    }>;
    relativeDateContext?: string; // "tomorrow", "yesterday", etc.
}

export interface ConversationContext {
    lastWeatherQuery: string;
    queryIntent: 'weather' | 'clothing' | 'travel' | 'comparison' | 'general';
    followUpContext: string | null;
    conversationFlow: Array<{
        type: 'location' | 'date' | 'intent';
        value: string;
        timestamp: string;
    }>;
    lastResponse?: string;
}

export interface UserPreferences {
    language: 'en' | 'ja';
    units: 'metric' | 'imperial';
    detailLevel: 'basic' | 'detailed';
    favoriteLocations: LocationData[];
    defaultLocation?: LocationData;
}

export interface WeatherContext {
    location: {
        current: LocationData | null;
        recent: LocationData[];
        preferences: string[];
    };
    temporal: TemporalContext;
    conversation: ConversationContext;
    preferences: UserPreferences;
    session: {
        startTime: string;
        lastActivity: string;
        messageCount: number;
    };
}

class ContextManager {
    private context: WeatherContext;
    private readonly STORAGE_KEY = 'weather-app-context';
    private readonly MAX_RECENT_LOCATIONS = 5;
    private readonly MAX_RECENT_DATES = 10;
    private readonly CONTEXT_EXPIRY_HOURS = 24;

    constructor() {
        this.context = this.initializeContext();
        this.loadPersistedContext();
    }

    private initializeContext(): WeatherContext {
        return {
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
                language: 'ja',
                units: 'metric',
                detailLevel: 'detailed',
                favoriteLocations: []
            },
            session: {
                startTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                messageCount: 0
            }
        };
    }

    private loadPersistedContext(): void {
        // Only run on client side
        if (typeof window === 'undefined') {
            console.log('🔄 Server-side rendering detected, skipping context restoration');
            return;
        }

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsedContext = JSON.parse(stored);

                // Check if context is not expired
                const lastActivity = new Date(parsedContext.session?.lastActivity || 0);
                const now = new Date();
                const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < this.CONTEXT_EXPIRY_HOURS) {
                    // Merge with current context, preserving session info
                    this.context = {
                        ...this.context,
                        ...parsedContext,
                        session: {
                            ...parsedContext.session,
                            lastActivity: new Date().toISOString()
                        }
                    };
                    console.log('🔄 Context restored from storage');
                } else {
                    console.log('⏰ Stored context expired, starting fresh');
                    this.clearPersistedContext();
                }
            }
        } catch (error) {
            console.error('❌ Failed to load persisted context:', error);
        }
    }

    private persistContext(): void {
        // Only run on client side
        if (typeof window === 'undefined') {
            return;
        }

        try {
            this.context.session.lastActivity = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.context));
        } catch (error) {
            console.error('❌ Failed to persist context:', error);
        }
    }

    private clearPersistedContext(): void {
        // Only run on client side
        if (typeof window === 'undefined') {
            return;
        }

        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error('❌ Failed to clear persisted context:', error);
        }
    }

    // Location Management
    updateLocation(location: LocationData): void {
        console.log('📍 Updating location context:', location.city);

        // Set as current location
        this.context.location.current = {
            ...location,
            lastUsed: new Date().toISOString(),
            confidence: location.confidence || 1.0
        };

        // Add to recent locations (avoid duplicates)
        this.context.location.recent = this.context.location.recent.filter(
            loc => !(loc.city === location.city && loc.country === location.country)
        );

        this.context.location.recent.unshift(this.context.location.current);

        // Keep only recent locations
        if (this.context.location.recent.length > this.MAX_RECENT_LOCATIONS) {
            this.context.location.recent = this.context.location.recent.slice(0, this.MAX_RECENT_LOCATIONS);
        }

        this.addToConversationFlow('location', `${location.city}, ${location.country}`);
        this.persistContext();
    }

    getCurrentLocation(): LocationData | null {
        return this.context.location.current;
    }

    getRecentLocations(): LocationData[] {
        return this.context.location.recent;
    }

    // Temporal Context Management
    updateTemporalContext(timeframe: 'current' | 'historical' | 'forecast', targetDate?: string, relativeDateContext?: string): void {
        console.log('📅 Updating temporal context:', timeframe, targetDate);

        this.context.temporal.currentTimeframe = timeframe;
        this.context.temporal.targetDate = targetDate || null;
        this.context.temporal.relativeDateContext = relativeDateContext;

        if (targetDate && timeframe !== 'current') {
            // Add to recent dates
            this.context.temporal.recentDates = this.context.temporal.recentDates.filter(
                d => d.date !== targetDate
            );

            this.context.temporal.recentDates.unshift({
                date: targetDate,
                type: timeframe as 'historical' | 'forecast',
                lastUsed: new Date().toISOString()
            });

            // Keep only recent dates
            if (this.context.temporal.recentDates.length > this.MAX_RECENT_DATES) {
                this.context.temporal.recentDates = this.context.temporal.recentDates.slice(0, this.MAX_RECENT_DATES);
            }

            this.addToConversationFlow('date', relativeDateContext || targetDate);
        }

        this.persistContext();
    }

    getCurrentTimeframe(): TemporalContext {
        return this.context.temporal;
    }

    // Conversation Context Management
    updateConversationContext(query: string, intent: ConversationContext['queryIntent'], followUpContext?: string): void {
        console.log('💬 Updating conversation context:', intent);

        this.context.conversation.lastWeatherQuery = query;
        this.context.conversation.queryIntent = intent;
        this.context.conversation.followUpContext = followUpContext || null;
        this.context.session.messageCount++;

        this.addToConversationFlow('intent', intent);
        this.persistContext();
    }

    private addToConversationFlow(type: 'location' | 'date' | 'intent', value: string): void {
        this.context.conversation.conversationFlow.push({
            type,
            value,
            timestamp: new Date().toISOString()
        });

        // Keep only recent flow items (last 20)
        if (this.context.conversation.conversationFlow.length > 20) {
            this.context.conversation.conversationFlow = this.context.conversation.conversationFlow.slice(-20);
        }
    }

    getConversationContext(): ConversationContext {
        return this.context.conversation;
    }

    // Simple Context Resolution (client-side)
    resolveImplicitContext(query: string, language: string = 'en'): {
        location: LocationData | null;
        temporal: TemporalContext;
        needsLocationInput: boolean;
        needsTimeInput: boolean;
        contextualQuery: string;
    } {
        console.log('🧠 Resolving implicit context for query:', query);

        // Simple client-side context resolution
        const hasExplicitLocation = language === 'ja'
            ? /の天気|で|に/.test(query)
            : /in |at |for /.test(query.toLowerCase());

        // Determine if we need more input
        const needsLocationInput = !hasExplicitLocation && !this.context.location.current;
        const needsTimeInput = false; // We'll default to current time

        // Create enhanced query with context
        let contextualQuery = query;
        if (!hasExplicitLocation && this.context.location.current) {
            const locationContext = language === 'ja'
                ? `${this.context.location.current.city}の${query}`
                : `${query} in ${this.context.location.current.city}`;
            contextualQuery = locationContext;
        }

        return {
            location: this.context.location.current,
            temporal: this.context.temporal,
            needsLocationInput,
            needsTimeInput,
            contextualQuery
        };
    }

    // Preferences Management
    updatePreferences(preferences: Partial<UserPreferences>): void {
        this.context.preferences = { ...this.context.preferences, ...preferences };
        this.persistContext();
    }

    getPreferences(): UserPreferences {
        return this.context.preferences;
    }

    // Utility Methods
    getFullContext(): WeatherContext {
        return { ...this.context };
    }

    clearContext(): void {
        this.context = this.initializeContext();
        this.clearPersistedContext();
        console.log('🧹 Context cleared');
    }

    // Context Summary for AI
    getContextSummary(): string {
        const location = this.context.location.current;
        const temporal = this.context.temporal;
        const conversation = this.context.conversation;

        return `Current Context:
- Location: ${location ? `${location.city}, ${location.country}` : 'Not set'}
- Timeframe: ${temporal.currentTimeframe}${temporal.targetDate ? ` (${temporal.targetDate})` : ''}
- Last Query: ${conversation.lastWeatherQuery || 'None'}
- Intent: ${conversation.queryIntent}
- Recent Locations: ${this.context.location.recent.slice(0, 3).map(l => l.city).join(', ') || 'None'}
- Session: ${this.context.session.messageCount} messages`;
    }
}

// Singleton instance
export const contextManager = new ContextManager();

// Export types and manager
export { ContextManager };