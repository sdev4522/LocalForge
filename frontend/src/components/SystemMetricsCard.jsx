import React from 'react';
import { Cpu, HardDrive, Wifi, Activity } from 'lucide-react';

export function SystemMetricsCard({ metrics, sseStatus }) {
  const cpuNum = parseFloat(metrics?.cpuLoad) || 0;
  const memNum = parseFloat(metrics?.memPercent) || 0;

  const usedMem = metrics?.usedMem || '0.0';
  const totalMem = metrics?.totalMem || '0.0';
  const availableMem = metrics?.availableMem || '0.0';
  const memPercent = metrics?.memPercent || '0.0';
  const cpuLoad = metrics?.cpuLoad || '0.0';

  return (
    <div className="forge-panel p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#262A34]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#FF6A3D]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[#EDEAE3] text-base">System Hardware & Resources</h2>
            <p className="text-xs text-[#ACAFB8] font-mono">Live Hardware Telemetry</p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition ${
            sseStatus === 'open'
              ? 'bg-[#3ED598]/10 text-[#3ED598] border-[#3ED598]/30'
              : sseStatus === 'connecting'
              ? 'bg-[#F5B94D]/10 text-[#F5B94D] border-[#F5B94D]/30 animate-pulse'
              : 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/30'
          }`}
          aria-label={`SSE Status: ${sseStatus}`}
        >
          <Wifi className={`w-3 h-3 ${sseStatus === 'open' ? 'animate-pulse' : ''}`} />
          <span>{sseStatus === 'open' ? 'Live Stream' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Metrics Grid (RAM & CPU) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* RAM Usage Box */}
        <div className="p-4 bg-[#0D0F14] rounded-xl border border-[#262A34] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#3ED598]" />
              <span className="text-xs font-bold text-[#EDEAE3] font-body">RAM Memory</span>
            </div>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                memNum > 85
                  ? 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/30'
                  : memNum > 60
                  ? 'bg-[#F5B94D]/10 text-[#F5B94D] border-[#F5B94D]/30'
                  : 'bg-[#3ED598]/10 text-[#3ED598] border-[#3ED598]/30'
              }`}
            >
              {memPercent}% Used
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-[#3ED598] font-mono">
                {usedMem} GB
              </span>
              <span className="text-xs text-[#ACAFB8] font-mono font-medium">
                out of {totalMem} GB
              </span>
            </div>
            <p className="text-[11px] text-[#7B7F8B] font-mono mt-0.5">
              {availableMem} GB Free Available
            </p>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-[#12141A] rounded-full overflow-hidden border border-[#262A34]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                memNum > 85
                  ? 'bg-[#FF5C5C]'
                  : memNum > 60
                  ? 'bg-[#F5B94D]'
                  : 'bg-[#3ED598]'
              }`}
              style={{ width: `${Math.min(memNum, 100)}%` }}
            />
          </div>
        </div>

        {/* CPU Usage Box */}
        <div className="p-4 bg-[#0D0F14] rounded-xl border border-[#262A34] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#FF6A3D]" />
              <span className="text-xs font-bold text-[#EDEAE3] font-body">CPU Usage</span>
            </div>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                cpuNum > 85
                  ? 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/30'
                  : cpuNum > 60
                  ? 'bg-[#F5B94D]/10 text-[#F5B94D] border-[#F5B94D]/30'
                  : 'bg-[#3ED598]/10 text-[#3ED598] border-[#3ED598]/30'
              }`}
            >
              {cpuNum > 85 ? 'High Load' : cpuNum > 60 ? 'Moderate' : 'Normal'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-[#FF6A3D] font-mono">
                {cpuLoad}%
              </span>
              <span className="text-xs text-[#ACAFB8] font-mono font-medium">
                Processor Load
              </span>
            </div>
            <p className="text-[11px] text-[#7B7F8B] font-mono mt-0.5">
              System Core Utilization
            </p>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-[#12141A] rounded-full overflow-hidden border border-[#262A34]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                cpuNum > 85
                  ? 'bg-[#FF5C5C]'
                  : cpuNum > 60
                  ? 'bg-[#F5B94D]'
                  : 'bg-[#FF6A3D]'
              }`}
              style={{ width: `${Math.min(cpuNum, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
