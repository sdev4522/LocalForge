import { useState, useEffect, useRef } from 'react';

export function useSSE(url, initialData = null) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'open' | 'error'
  const retryCountRef = useRef(0);
  const eventSourceRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      setStatus('connecting');
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setStatus('open');
        retryCountRef.current = 0; // reset backoff on successful connection
      };

      es.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (err) {
          setData(event.data);
        }
      };

      es.onerror = () => {
        if (!isMounted) return;
        setStatus('error');
        es.close();

        // Exponential backoff reconnect: 1s, 2s, 4s, 8s up to max 10s
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        retryCountRef.current += 1;

        timeoutRef.current = setTimeout(() => {
          if (isMounted) {
            connect();
          }
        }, backoffDelay);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [url]);

  return { data, status };
}
