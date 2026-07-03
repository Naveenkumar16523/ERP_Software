// frontend/src/utils/ws.js
// Global WebSocket manager for realtime events

class RealtimeManager {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.listeners = new Set();
    this.isConnecting = false;
  }

  connect() {
    if (this.ws || this.isConnecting) return;
    
    const token = localStorage.getItem('token');
    if (!token) return; // Cannot connect without auth
    
    this.isConnecting = true;
    
    // Construct ws:// or wss:// URL based on current origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend URL from env, or fallback to relative hostname
    const apiBaseUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}/api/v1`;
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '');
    
    const wsUrl = `${wsBaseUrl}/ws/events?token=${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('[Realtime] Connected to live events stream');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };
      
      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach(fn => fn(data));
        } catch (err) {
          console.error('[Realtime] Message parse error:', err);
        }
      };
      
      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        console.log('[Realtime] Connection closed. Reconnecting in 5s...');
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      };
      
      this.ws.onerror = (err) => {
        console.error('[Realtime] Connection error:', err);
        this.ws.close();
      };
      
      // Keep-alive ping
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send('ping');
        }
      }, 30000);
      
    } catch (err) {
      this.isConnecting = false;
      console.error('[Realtime] Failed to establish connection:', err);
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.onclose = null; // Prevent auto-reconnect
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const realtime = new RealtimeManager();

// React Hook for components to subscribe to specific events
import { useEffect } from 'react';

export function useRealtimeEvent(moduleKey, eventType, callback) {
  useEffect(() => {
    const unsub = realtime.subscribe((event) => {
      // If event matches the module and type, trigger callback
      if (
        (!moduleKey || event.module === moduleKey) && 
        (!eventType || event.type === eventType)
      ) {
        callback(event.payload);
      }
    });
    return unsub;
  }, [moduleKey, eventType, callback]);
}
