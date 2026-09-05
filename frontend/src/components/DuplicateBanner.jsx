import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Database, Cpu, ArrowRight } from 'lucide-react';

export default function DuplicateBanner({ scanResult }) {
  if (!scanResult) return null;

  const { stored, similarity, message, existing_match } = scanResult;
  const matchPct = (similarity * 100).toFixed(1);

  if (!stored) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-500/40 rounded-2xl p-5 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Deduplication Gate Active
                </span>
                <span className="text-xs font-mono text-amber-400/80">
                  Cosine Similarity: {matchPct}% (Threshold ≥ 85%)
                </span>
              </div>
              <h4 className="text-base font-bold text-white mt-1">
                {message}
              </h4>
              {existing_match && (
                <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-1.5">
                  <span className="text-slate-400">Closest Neighbor ID #{existing_match.id}:</span>
                  <span className="font-semibold text-amber-200">"{existing_match.title}"</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl px-4 py-2 text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Persistence Action</span>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              STORAGE SKIPPED
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-emerald-500/10 border border-emerald-500/40 rounded-2xl p-5 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Unique Concept Gated & Passed
              </span>
              <span className="text-xs font-mono text-emerald-400/80">
                Max Prior Overlap: {matchPct}% (Threshold &lt; 85%)
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-1">
              New Unique Concept Indexed in Vector Store
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Successfully committed to Supabase pgvector HNSW index with 384-dimensional FastEmbed embedding.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl px-4 py-2 text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Persistence Action</span>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            COMMITTED (384-DIM)
          </span>
        </div>
      </div>
    </div>
  );
}
