import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Cpu } from 'lucide-react';

export default function DocumentUpload({ onScanComplete, isLoading, setIsLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'text'
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const sampleDirtyProposal = `Project Proposal: ESP32 Smart Agricultural Telemetry Node with React & MQTT

We build an intelligent agricultural monitoring station using an ESP32 microcontroller paired with DHT22 and soil sensors.
The telemetry data is transmitted asynchronously over an MQTT broker via Wi-Fi to a FastAPI backend deployed on AWS EC2.
A React.js dashboard visualizes moisture trends, while a YOLOv8 CNN model in PyTorch processes crop imagery to detect leaf blight.
Historical telemetry is committed to a PostgreSQL database on Supabase.`;

  const sampleCleanConcept = `Decentralized Soil Salinity Equilibrium Sensor Mesh

Problem Statement:
Arid region agriculture experiences uncontrolled root-zone hyper-salinization, causing 40% irreversible crop root desiccation and premature vegetation die-off.

Conceptual Vision:
Continuous in-situ ionic conductivity equilibrium monitoring across an asynchronous peer-to-peer telemetry mesh, deploying localized algorithmic threshold triggers to modulate sub-surface pulse irrigation dynamically.

Intended Impact:
35% reduction in groundwater degradation and a 28% increase in perennial crop yield resilience.`;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    if (!file.name.match(/\.(pdf|txt|md)$/i)) {
      alert('Please upload a PDF (.pdf) or Plain Text (.txt, .md) file.');
      return;
    }
    setSelectedFile(file);
  };

  const handleScan = async () => {
    if (inputMode === 'file' && !selectedFile) {
      alert('Please select a file to scan.');
      return;
    }
    if (inputMode === 'text' && !textInput.trim()) {
      alert('Please enter document text to scan.');
      return;
    }

    setIsLoading(true);
    setUploadProgress(20);

    const formData = new FormData();
    if (inputMode === 'file' && selectedFile) {
      formData.append('file', selectedFile);
    } else {
      formData.append('text', textInput);
    }

    // Simulate progress while processing in RAM
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 400);

    try {
      const response = await fetch('/api/scan-document', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Scan processing failed');
      }

      const result = await response.json();
      onScanComplete(result);
    } catch (err) {
      clearInterval(progressInterval);
      alert(`Error during distillation scan: ${err.message}`);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      {/* Header & Modes */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            Zero-Storage Document Distillation Target
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Processed 100% in RAM • Zero disk/bucket persistence • FastEmbed CPU 384-dim
          </p>
        </div>

        {/* Input Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              inputMode === 'file'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            File Upload (PDF/TXT)
          </button>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              inputMode === 'text'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Text Paste
          </button>
        </div>
      </div>

      {/* Input Area */}
      {inputMode === 'file' ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : selectedFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                selectedFile
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-indigo-500/10 text-indigo-400'
              }`}
            >
              {selectedFile ? <FileText className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
            </div>

            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • In-Memory RAM Streaming
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop your project proposal PDF or document here
                </p>
                <p className="text-xs text-slate-500 mt-1">Supports PDF, TXT, MD up to 10MB</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your technical proposal, problem document, or architecture notes here..."
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              {textInput.length} characters • Memory-only buffer
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTextInput(sampleDirtyProposal)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Load Hardware Proposal
              </button>
              <button
                type="button"
                onClick={() => setTextInput(sampleCleanConcept)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Load Salinity Sensor Example
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isLoading && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              Cognitive Sanitizer & FastEmbed Vector Gate...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleScan}
          disabled={isLoading || (inputMode === 'file' && !selectedFile) || (inputMode === 'text' && !textInput.trim())}
          className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-200 ${
            isLoading || (inputMode === 'file' && !selectedFile) || (inputMode === 'text' && !textInput.trim())
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Distilling & Deduplicating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-300" />
              Distill Concept & Evaluate Gate
            </>
          )}
        </button>
      </div>
    </div>
  );
}
