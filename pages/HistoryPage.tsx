
import React, { useEffect, useState } from 'react';
import { ArchitectureRun } from '../types';
import { dbService } from '../services/dbService';

const HistoryPage: React.FC = () => {
  const [runs, setRuns] = useState<ArchitectureRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<ArchitectureRun | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      const allRuns = await dbService.getAllRuns();
      setRuns(allRuns);
    };
    fetchRuns();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/3 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-fit">
        <div className="px-6 py-4 bg-slate-700/50 border-b border-slate-700">
          <h2 className="text-lg font-bold">Past Generations</h2>
          <p className="text-xs text-slate-400">{runs.length} runs stored</p>
        </div>
        <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-700">
          {runs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">
              No history found. Generate your first architecture!
            </div>
          ) : (
            runs.map(run => (
              <button
                key={run.id}
                onClick={() => setSelectedRun(run)}
                className={`w-full text-left p-4 hover:bg-slate-700/30 transition-colors ${selectedRun?.id === run.id ? 'bg-indigo-900/20 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
              >
                <div className="font-bold text-slate-200 truncate">{run.business_name}</div>
                <div className="text-xs text-slate-400 mt-1">{run.service_domain}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{formatDate(run.created_at)}</span>
                  {run.debug_mode && (
                    <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">DEBUG</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 min-h-[500px]">
        {selectedRun ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedRun.business_name}</h2>
                  <p className="text-indigo-400 font-medium">{selectedRun.service_domain} {selectedRun.region ? `• ${selectedRun.region}` : ''}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  ID: {selectedRun.id.split('-')[0]}...<br />
                  {formatDate(selectedRun.created_at)}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-800 px-6 py-3 border-b border-slate-700">
                <h3 className="font-mono text-green-300 font-medium">ASCII Sitemap Architecture</h3>
              </div>
              <div className="p-6 overflow-x-auto bg-slate-950">
                <pre className="font-mono text-green-400 text-sm whitespace-pre">
                  {selectedRun.ascii_tree}
                </pre>
              </div>
            </div>

            {selectedRun.debug_mode && selectedRun.semantic_map && (
              <div className="mt-6 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-800 px-6 py-3 border-b border-slate-700">
                  <h3 className="font-mono text-purple-300 font-medium">Semantic Map Metadata</h3>
                </div>
                <div className="p-6 overflow-x-auto max-h-[400px] bg-slate-950">
                  <pre className="font-mono text-slate-400 text-xs">
                    {JSON.stringify(selectedRun.semantic_map, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl p-12">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-lg">Select a generation from history to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
