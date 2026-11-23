import { useEffect, useState, useRef } from 'react';

const DEFAULT_BASE_URL =
  typeof window !== 'undefined' && window.location.port === '5173'
    ? '/api/v1'
    : 'http://localhost:8000/api/v1';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
const STREAM_URL = `${API_BASE_URL}/realtime/stream/`;

// Singleton SSE connection manager for active tab
class RealtimeConnectionManager {
  constructor() {
    this.eventSource = null;
    this.subscribers = new Set();
    this.retryCount = 0;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.connectionStateListeners = new Set();
  }

  notifyConnectionState(connected) {
    this.isConnected = connected;
    this.connectionStateListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (err) {
        console.warn('Error in connection state listener:', err);
      }
    });
  }

  connect() {
    if (this.eventSource || typeof window === 'undefined' || !('EventSource' in window)) {
      return;
    }

    try {
      this.eventSource = new EventSource(STREAM_URL);

      this.eventSource.onopen = () => {
        this.retryCount = 0;
        this.notifyConnectionState(true);
      };

      this.eventSource.addEventListener('connected', () => {
        this.retryCount = 0;
        this.notifyConnectionState(true);
      });

      const eventNames = [
        'student.registered',
        'student.updated',
        'accessibility.updated',
        'academics.updated',
      ];

      eventNames.forEach((eventName) => {
        this.eventSource.addEventListener(eventName, (event) => {
          try {
            const data = JSON.parse(event.data);
            this.dispatch(eventName, data);
          } catch (err) {
            console.warn(`Failed to parse SSE event data for ${eventName}:`, err);
          }
        });
      });

      this.eventSource.onerror = () => {
        this.notifyConnectionState(false);
        this.cleanupEventSource();
        this.scheduleReconnect();
      };
    } catch (err) {
      this.notifyConnectionState(false);
      this.scheduleReconnect();
    }
  }

  cleanupEventSource() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (e) {
        // Ignored
      }
      this.eventSource = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.subscribers.size === 0) return;
    const delay = Math.min(16000, 1000 * Math.pow(2, this.retryCount));
    this.retryCount += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.subscribers.size > 0) {
        this.connect();
      }
    }, delay);
  }

  dispatch(eventName, data) {
    this.subscribers.forEach((sub) => {
      try {
        if (sub.handlers && typeof sub.handlers[eventName] === 'function') {
          sub.handlers[eventName](data);
        }
        if (sub.onAnyEvent && typeof sub.onAnyEvent === 'function') {
          sub.onAnyEvent(eventName, data);
        }
      } catch (err) {
        console.error(`Error in realtime subscriber handler for ${eventName}:`, err);
      }
    });
  }

  subscribe(subscriber) {
    this.subscribers.add(subscriber);
    if (this.subscribers.size === 1) {
      this.connect();
    } else if (this.isConnected && subscriber.onConnectionChange) {
      subscriber.onConnectionChange(true);
    }
    return () => {
      this.subscribers.delete(subscriber);
      if (this.subscribers.size === 0) {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.cleanupEventSource();
        this.notifyConnectionState(false);
      }
    };
  }
}

const manager = new RealtimeConnectionManager();

/**
 * Reusable hook to subscribe to real-time database SSE events.
 *
 * @param {Object} handlers - Map of event name to callback function.
 *   E.g.: {
 *     'student.registered': (studentData) => ...,
 *     'student.updated': (updateData) => ...,
 *     'accessibility.updated': (a11yData) => ...,
 *     'academics.updated': (academicData) => ...
 *   }
 * @returns {Object} { isConnected, lastEvent }
 */
export function useRealtimeSync(handlers = {}) {
  const [isConnected, setIsConnected] = useState(manager.isConnected);
  const [lastEvent, setLastEvent] = useState(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const subscriber = {
      handlers: {
        'student.registered': (data) => {
          setLastEvent({ type: 'student.registered', data, timestamp: Date.now() });
          handlersRef.current['student.registered']?.(data);
        },
        'student.updated': (data) => {
          setLastEvent({ type: 'student.updated', data, timestamp: Date.now() });
          handlersRef.current['student.updated']?.(data);
        },
        'accessibility.updated': (data) => {
          setLastEvent({ type: 'accessibility.updated', data, timestamp: Date.now() });
          handlersRef.current['accessibility.updated']?.(data);
        },
        'academics.updated': (data) => {
          setLastEvent({ type: 'academics.updated', data, timestamp: Date.now() });
          handlersRef.current['academics.updated']?.(data);
        },
      },
      onConnectionChange: (state) => {
        setIsConnected(state);
      },
    };

    const unsubscribeState = (state) => setIsConnected(state);
    manager.connectionStateListeners.add(unsubscribeState);
    const unsubscribe = manager.subscribe(subscriber);

    return () => {
      manager.connectionStateListeners.delete(unsubscribeState);
      unsubscribe();
    };
  }, []);

  return { isConnected, lastEvent };
}
