import React from 'react';
import { Database, Download, Trash2 } from 'lucide-react';

export function DatabaseCard({ dbName, onDropRequest }) {
  const nameStr = typeof dbName === 'object' && dbName !== null ? (dbName.name || '') : String(dbName || '');

  return (
    <div className="p-3.5 bg-[#0D0F14] hover:bg-[#1F2330] rounded-xl border border-[#262A34] flex items-center justify-between gap-3 transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#12141A] border border-[#262A34] flex items-center justify-center shrink-0">
          <Database className="w-4 h-4 text-[#5B9DFF]" />
        </div>
        <span className="font-mono font-bold text-[#EDEAE3] text-xs sm:text-sm truncate">{nameStr}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`/api/db/export/${nameStr}`}
          download={`${nameStr}.sql`}
          className="btn-secondary text-xs py-1 px-2.5 min-h-[36px] flex items-center gap-1.5"
          aria-label={`Export SQL dump for database ${nameStr}`}
          title="Export SQL Dump"
        >
          <Download className="w-3.5 h-3.5 text-[#ACAFB8]" />
          <span>Export</span>
        </a>

        <button
          onClick={() => onDropRequest(nameStr)}
          className="btn-destructive p-2 min-h-[36px] min-w-[36px]"
          aria-label={`Drop database ${nameStr}`}
          title="Drop Database"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
