/// <reference types="vite/client" />
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useERPStore } from '../store/useERPStore';

const WS_URL = import.meta.env.VITE_API_URL?.replace('http', 'ws') ?? 'ws://localhost:5001';

export function useRealtimeEvents() {
  const qc = useQueryClient();
  const token = useERPStore((s) => s.token);
  const addNotification = useERPStore((s) => s.addNotification);
  const setRealtimeConnected = useERPStore((s) => s.setRealtimeConnected);

  useEffect(() => {
    if (!token) return;
    
    let ws: WebSocket | null = null;
    let ping: NodeJS.Timeout;

    const timeout = setTimeout(() => {
      ws = new WebSocket(`${WS_URL}/api/v1/ws/events?token=${token}`);
      
      ws.onopen = () => {
        setRealtimeConnected(true);
      };

      ws.onmessage = (e) => {
        if (e.data === 'pong') return;
        try {
          const event = JSON.parse(e.data);
          switch (event.type) {
            case 'invoice_updated':
              qc.invalidateQueries({ queryKey: ['finance', 'invoices'] });
              break;
            case 'employee_added':
              qc.invalidateQueries({ queryKey: ['hr', 'employees'] });
              break;
            case 'stock_low':
              qc.invalidateQueries({ queryKey: ['inventory', 'products'] });
              addNotification(`Low stock alert: ${event.payload?.productName}`, 'warning');
              break;
            case 'new_lead':
              qc.invalidateQueries({ queryKey: ['crm', 'leads'] });
              break;
            case 'dashboard_refresh':
              qc.invalidateQueries({ queryKey: ['dashboard'] });
              break;
          }
        } catch (err) {
          console.error('Failed to parse websocket message', err);
        }
      };

      ws.onerror = () => {
        setRealtimeConnected(false);
        if (ws) ws.close();
      };
      ws.onclose = () => {
        setRealtimeConnected(false);
      };
      
      ping = setInterval(() => {
        if (ws && ws.readyState === 1) {
          ws.send('ping');
        }
      }, 30_000);
    }, 50);

    return () => {
      clearTimeout(timeout);
      clearInterval(ping);
      setRealtimeConnected(false);
      if (ws) {
        ws.close();
      }
    };
  }, [token, qc, addNotification, setRealtimeConnected]);
}
