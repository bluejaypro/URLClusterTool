
import React, { useState } from 'react';
import { GenerateParams, ArchitectureRun, SemanticMap } from '../types';
import { validateTaxonomy, generateSemanticMap, renderAsciiTree } from '../services/geminiService';
import { dbService } from '../services/dbService';

type StepStatus = 'pending' | 'loading' | 'completed';

const GeneratorPage: React.FC = () => {
  const [formData, setFormData] = useState<GenerateParams>({
    businessName: '',
    serviceDomain: '',
    region: '',
    debugMode: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ArchitectureRun | null>(null);

  // Status for granular progress
  const [stages, setStages] = useState<{
    taxonomy: StepStatus;
    mapping: StepStatus;
    rendering: StepStatus;
  }>({
    taxonomy: 'pending',
    mapping: 'pending',
    rendering: 'pending',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateArchitecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.serviceDomain) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStages({ taxonomy: 'loading', mapping: 'pending', rendering: 'pending' });

    try {
      // Step 1: Disambiguate/Validate Taxonomy
      setLoadingStep('Validating service taxonomy via Google Search...');
      const taxonomyHints = await validateTaxonomy(formData.serviceDomain);
      setStages(s => ({ ...s, taxonomy: 'completed', mapping: 'loading' }));
      
      // Step 2: Generate Map (Equivalent to /api/architecture/debug)
      setLoadingStep('Analyzing semantic intent layers (Thinking)...');
      const semanticMap = await generateSemanticMap(
        formData.businessName,
        formData.serviceDomain,
        formData.region,
        taxonomyHints
      );
      setStages(s => ({ ...s, mapping: 'completed', rendering: 'loading' }));

      // Step 3: Render Tree (Equivalent to logic in /api/architecture/generate)
      setLoadingStep('Generating deterministic ASCII sitemap...');
      const asciiTree = await renderAsciiTree(semanticMap, formData.businessName);
      setStages(s => ({ ...s, rendering: 'completed' }));

      const run: ArchitectureRun = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        business_name: formData.businessName,
        service_domain: formData.serviceDomain,
        region: formData.region,
        debug_mode: formData.debugMode,
        semantic_map: formData.debugMode ? semanticMap : undefined,
        ascii_tree: asciiTree
      };

      await dbService.saveRun(run);
      setResult(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      // Reset stages on error if needed or keep progress visible
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StepIndicator = ({ label, status, isLast = false }: { label: string, status: StepStatus, isLast?: boolean }) => {
    const isActive = status === 'loading';
    const isDone = status === 'completed';

    return (
      <div className={`flex items-center gap-3 relative ${isLast ? '' : 'flex-1'}`}>
        <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 text-[10px] font-bold transition-all duration-300 ${
          isDone ? 'bg-green-500 border-green-500 text-white' : 
          isActive ? 'border-indigo-500 text-indigo-400 animate-pulse' : 
          'border-slate-700 text-slate-600'
        }`}>
          {isDone ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : '•'}
        </div>
        <div className="flex flex-col">
          <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${
            isActive ? 'text-indigo-400' : isDone ? 'text-green-400' : 'text-slate-600'
          }`}>
            {label}
          </span>
        </div>
        {!isLast && (
          <div className={`hidden md:block absolute left-6 top-3 w-[calc(100%-1.5rem)] h-[1px] -z-10 transition-colors duration-500 ${
            isDone ? 'bg-green-500/50' : 'bg-slate-700'
          }`} />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-indigo-300">New SEO Architecture</h2>
        <form onSubmit={generateArchitecture} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Business Name</label>
            <input
              type="text"
              name="businessName"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="e.g. AquaClear Solutions"
              value={formData.businessName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Parent Service Domain</label>
            <input
              type="text"
              name="serviceDomain"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="e.g. pool cleaning service"
              value={formData.serviceDomain}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Region (Optional)</label>
            <input
              type="text"
              name="region"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="e.g. Phoenix, AZ"
              value={formData.region}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex items-center gap-3 pt-8">
            <input
              type="checkbox"
              id="debugMode"
              name="debugMode"
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              checked={formData.debugMode}
              onChange={handleInputChange}
            />
            <label htmlFor="debugMode" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
              Debug Mode <span className="text-xs text-slate-500">(Includes Semantic Map JSON)</span>
            </label>
          </div>
          
          <div className="md:col-span-2">
            {loading && (
              <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
                  <StepIndicator label="Taxonomy" status={stages.taxonomy} />
                  <StepIndicator label="Mapping" status={stages.mapping} />
                  <StepIndicator label="Rendering" status={stages.rendering} isLast />
                </div>
                
                <div className="pt-2 border-t border-slate-800/50">
                   <div className="flex justify-between items-center text-[11px] font-mono text-indigo-400 mb-2">
                    <span className="flex items-center gap-2">
                       <span className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></span>
                       {loadingStep}
                    </span>
                    <span className="text-slate-500">{
                      stages.rendering === 'loading' ? '90%' : 
                      stages.mapping === 'loading' ? '50%' : 
                      stages.taxonomy === 'loading' ? '15%' : '0%'
                    }</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1">
                    <div 
                      className="bg-indigo-500 h-1 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      style={{ 
                        width: stages.rendering === 'loading' ? '90%' : 
                               stages.mapping === 'loading' ? '50%' : 
                               stages.taxonomy === 'loading' ? '15%' : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all transform active:scale-[0.98] ${loading ? 'bg-indigo-800 cursor-not-allowed opacity-70' : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Architecting...
                </span>
              ) : 'Generate Architecture'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-mono text-indigo-300 font-medium">Sitemap ASCII Tree</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => copyToClipboard(result.ascii_tree)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors"
                >
                  Copy
                </button>
                <button 
                  onClick={() => downloadFile(result.ascii_tree, `${result.business_name.toLowerCase().replace(/\s+/g, '_')}_tree.txt`)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded transition-colors"
                >
                  Download .txt
                </button>
              </div>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="font-mono text-green-400 text-sm md:text-base leading-relaxed whitespace-pre">
                {result.ascii_tree}
              </pre>
            </div>
          </div>

          {result.debug_mode && result.semantic_map && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-mono text-purple-300 font-medium">Semantic Map (JSON)</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(result.semantic_map, null, 2))}
                    className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors"
                  >
                    Copy JSON
                  </button>
                  <button 
                    onClick={() => downloadFile(JSON.stringify(result.semantic_map, null, 2), `${result.business_name.toLowerCase().replace(/\s+/g, '_')}_map.json`)}
                    className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded transition-colors"
                  >
                    Download .json
                  </button>
                </div>
              </div>
              <details className="group">
                <summary className="px-6 py-3 cursor-pointer text-slate-400 hover:text-white transition-colors text-sm">
                  Click to toggle JSON data view
                </summary>
                <div className="p-6 border-t border-slate-800 max-h-[400px] overflow-y-auto">
                  <pre className="font-mono text-slate-300 text-xs">
                    {JSON.stringify(result.semantic_map, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeneratorPage;
