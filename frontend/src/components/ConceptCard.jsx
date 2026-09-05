import React, { useState } from 'react';
import { 
  Lightbulb, 
  Layers, 
  AlertTriangle, 
  Dna, 
  TrendingUp, 
  Copy, 
  Check, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';

export default function ConceptCard({ concept, isStored, similarity }) {
  const [copied, setCopied] = useState(false);

  if (!concept) return null;

  const handleCopy = () => {
    const formatted = `TITLE: ${concept.title}\nDOMAIN: ${concept.domain}\n\nPROBLEM STATEMENT:\n${concept.problem_statement}\n\nCONCEPTUAL VISION (DNA):\n${concept.conceptual_vision}\n\nINTENDED IMPACT:\n${concept.intended_impact}`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
              <Layers className="w-3 h-3" />
              {concept.domain || 'Interdisciplinary Domain'}
            </span>
            <h3 className="text-lg font-bold text-white leading-tight">
              {concept.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors self-end sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy DNA</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Core Conceptual Pillars */}
      <div className="space-y-4">
        {/* 1. Problem Statement */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>1. FUNDAMENTAL SYSTEMIC BOTTLENECK (PROBLEM)</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {concept.problem_statement}
          </p>
        </div>

        {/* 2. Conceptual Vision / Mechanism */}
        <div className="bg-slate-950/60 border border-indigo-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1.5">
            <Dna className="w-3.5 h-3.5 text-indigo-400" />
            <span>2. CONCEPTUAL MECHANISM & HYPOTHESIS (IDEA DNA)</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
              Zero How-To / Cleaned
            </span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {concept.conceptual_vision}
          </p>
        </div>

        {/* 3. Intended Impact */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>3. MEASURABLE SYSTEMIC OUTCOME (IMPACT)</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {concept.intended_impact}
          </p>
        </div>
      </div>

      {/* Footer Details */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Cognitive Negative Constraint Enforced (No Framework/Hardware Leaks)</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-500">Vector Status:</span>
          <span className={isStored ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {isStored ? 'INDEXED (New)' : 'GATED (Duplicate)'}
          </span>
        </div>
      </div>
    </div>
  );
}
