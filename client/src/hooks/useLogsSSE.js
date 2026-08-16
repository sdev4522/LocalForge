import { useState, useEffect, useRef } from 'react';

export function useLogsSSE(type = 'error', lines = 50) {
  const [logLines, setLogLines] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;

  useEffect(() => {
    setLogLines([]);
    const eventSource = new EventSource(`/api/logs/stream?type=${type}&lines=${lines}`);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (pausedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log_chunk') {
          const lines = data.chunk.split('\n').filter(Boolean);
          setLogLines((prev) => [...prev, ...lines].slice(-500));
        }
      } catch (e) {
        // Fallback for non-json
        if (typeof event.data === 'string') {
          setLogLines((prev) => [...prev, event.data].slice(-500));
        }
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [type, lines]);

  const clearLogs = () => setLogLines([]);
  const togglePause = () => setIsPaused((prev) => !prev);

  return { logLines, connected, isPaused, togglePause, clearLogs };
}
