import { useState, useEffect } from 'react';

export function useMetricsSSE() {
  const [metrics, setMetrics] = useState({
    cpuLoad: '0.0',
    totalMem: '0.00',
    usedMem: '0.00',
    availableMem: '0.00',
    memPercent: '0.0',
    services: { nginx: false, mariadb: false, phpFpm: false },
    connected: false,
  });

  useEffect(() => {
    const eventSource = new EventSource('/api/metrics/stream');

    eventSource.onopen = () => {
      setMetrics((prev) => ({ ...prev, connected: true }));
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'metrics') {
          setMetrics({
            cpuLoad: data.cpuLoad || '0.0',
            totalMem: data.totalMem || '0.00',
            usedMem: data.usedMem || '0.00',
            availableMem: data.availableMem || '0.00',
            memPercent: data.memPercent || '0.0',
            services: data.services || { nginx: false, mariadb: false, phpFpm: false },
            connected: true,
          });
        }
      } catch (err) {
        console.error('Error parsing metrics SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      setMetrics((prev) => ({ ...prev, connected: false }));
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return metrics;
}
