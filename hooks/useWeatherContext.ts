import { useState, useEffect, useCallback } from 'react';
import { contextManager, WeatherContext, LocationData } from '@/lib/contextManager';

interface UseWeatherContextReturn {
  context: WeatherContext;
  currentLocation: LocationData | null;
  recentLocations: LocationData[];
  updateLocation: (location: LocationData) => void;
  clearContext: () => void;
  getContextSummary: () => string;
  isContextLoaded: boolean;
}

export function useWeatherContext(): UseWeatherContextReturn {
  const [context, setContext] = useState<WeatherContext>(contextManager.getFullContext());
  const [isContextLoaded, setIsContextLoaded] = useState(false);

  // Update local state when context changes
  const refreshContext = useCallback(() => {
    const newContext = contextManager.getFullContext();
    setContext(newContext);
    console.log('🔄 Context refreshed in hook:', newContext.session.messageCount, 'messages');
  }, []);

  // Initialize context on mount
  useEffect(() => {
    refreshContext();
    setIsContextLoaded(true);
    console.log('🚀 Weather context hook initialized');
  }, [refreshContext]);

  // Update location and refresh context
  const updateLocation = useCallback((location: LocationData) => {
    console.log('📍 Updating location via hook:', location.city);
    contextManager.updateLocation(location);
    refreshContext();
  }, [refreshContext]);

  // Clear context and refresh
  const clearContext = useCallback(() => {
    console.log('🧹 Clearing context via hook');
    contextManager.clearContext();
    refreshContext();
  }, [refreshContext]);

  // Get context summary
  const getContextSummary = useCallback(() => {
    return contextManager.getContextSummary();
  }, []);

  return {
    context,
    currentLocation: context.location.current,
    recentLocations: context.location.recent,
    updateLocation,
    clearContext,
    getContextSummary,
    isContextLoaded
  };
}

// Hook for accessing just location context (lighter weight)
export function useLocationContext() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    contextManager.getCurrentLocation()
  );
  const [recentLocations, setRecentLocations] = useState<LocationData[]>(
    contextManager.getRecentLocations()
  );

  const refreshLocationContext = useCallback(() => {
    setCurrentLocation(contextManager.getCurrentLocation());
    setRecentLocations(contextManager.getRecentLocations());
  }, []);

  useEffect(() => {
    refreshLocationContext();
  }, [refreshLocationContext]);

  const updateLocation = useCallback((location: LocationData) => {
    contextManager.updateLocation(location);
    refreshLocationContext();
  }, [refreshLocationContext]);

  return {
    currentLocation,
    recentLocations,
    updateLocation,
    refreshLocationContext
  };
}

// Hook for accessing conversation context
export function useConversationContext() {
  const [conversationContext, setConversationContext] = useState(
    contextManager.getConversationContext()
  );

  const refreshConversationContext = useCallback(() => {
    setConversationContext(contextManager.getConversationContext());
  }, []);

  useEffect(() => {
    refreshConversationContext();
  }, [refreshConversationContext]);

  const updateConversation = useCallback((query: string, intent: any, followUp?: string) => {
    contextManager.updateConversationContext(query, intent, followUp);
    refreshConversationContext();
  }, [refreshConversationContext]);

  return {
    conversationContext,
    updateConversation,
    refreshConversationContext
  };
}