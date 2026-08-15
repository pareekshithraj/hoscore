import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { BASE_URL } from '../utils/apiConfig';

export type LiveVisit = {
  inQueue: boolean;
  status?: 'WAITING' | 'IN_CONSULTATION' | string;
  position?: number | null;
  tokenNumber?: number;
  doctorName?: string;
  department?: string;
  roomName?: string;
  hospitalName?: string;
};

const getWsUrl = (token: string) => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let host = window.location.host;
  if (BASE_URL.startsWith('http')) {
    const url = new URL(BASE_URL);
    host = url.host;
  }
  return `${wsProtocol}//${host}/ws?token=${token}`;
};

function notifyBrowser(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

export function useLiveVisit(patientId?: string | null) {
  const [visit, setVisit] = useState<LiveVisit>({ inQueue: false });
  const lastStatus = useRef<string | null>(null);

  const load = useCallback(() => {
    const url = patientId ? `/patient/visit?patientId=${patientId}` : '/patient/visit';
    api.get(url)
      .then((res: LiveVisit) => {
        const next = res || { inQueue: false };
        if (next.status === 'IN_CONSULTATION' && lastStatus.current !== 'IN_CONSULTATION') {
          notifyBrowser('You are being called', `Please go to ${next.roomName || 'the consultation room'}.`);
        }
        lastStatus.current = next.status || null;
        setVisit(next);
      })
      .catch(() => {});
  }, [patientId]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 8000);
    return () => clearInterval(poll);
  }, [load]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const hostname = window.location.hostname;
    const isServerless =
      hostname.endsWith('.vercel.app') ||
      hostname === 'hoscore.in' ||
      hostname === 'www.hoscore.in';
    if (isServerless) return;

    let ws: WebSocket | undefined;
    try {
      ws = new WebSocket(getWsUrl(token));
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'queue_called') {
            const data = payload.data || {};
            setVisit({
              inQueue: true,
              status: 'IN_CONSULTATION',
              tokenNumber: data.tokenNumber,
              doctorName: data.doctorName,
              department: data.department,
              roomName: data.roomName,
            });
            lastStatus.current = 'IN_CONSULTATION';
            notifyBrowser('You are being called', `Please go to ${data.roomName || 'the consultation room'}.`);
          }
          if (payload.type === 'queue_position_update') {
            const data = payload.data || {};
            setVisit((prev) => ({
              ...prev,
              inQueue: true,
              status: 'WAITING',
              position: data.position,
              doctorName: data.doctorName || prev.doctorName,
              roomName: data.roomName || prev.roomName,
            }));
          }
        } catch { /* ignore */ }
      };
    } catch { /* ignore */ }
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  return { visit, reload: load };
}
