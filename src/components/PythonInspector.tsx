import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { FIXED_PYTHON_FILES } from '../data/pythonFiles';

export const PythonInspector: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = FIXED_PYTHON_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    FIXED_PYTHON_FILES.forEach((f, idx) => {
      setTimeout(() => {
        const blob = new Blob([f.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, idx * 250);
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Arquivos Python Corrigidos &amp; Prontos
            </h2>
          </div>
          <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
            Todos os arquivos originais em Flask foram corrigidos contra falhas de execução, arquivos ausentes
            (<code className="text-indigo-400 font-mono">database.py</code>), funções JavaScript não definidas
            (<code className="text-indigo-400 font-mono">abrirLightbox</code> e <code className="text-indigo-400 font-mono">mostrarModalExclusao</code>) e vulnerabilidades de Path Traversal.
          </p>
        </div>
        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Arquivos Corrigidos</span>
        </button>
      </div>

      {/* Main Split: Left Selector + Right Code Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: File Tabs */}
        <div className="md:col-span-4 flex flex-col gap-2">
          <span className="text-xs font-semibold text-neutral-400 px-1 mb-1">
            Selecione o arquivo para inspecionar:
          </span>
          {FIXED_PYTHON_FILES.map((file, idx) => {
            const isSelected = idx === selectedFileIndex;
            return (
              <button
                key={file.filename}
                onClick={() => {
                  setSelectedFileIndex(idx);
                  setCopied(false);
                }}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-800 border-indigo-500 shadow-md'
                    : 'bg-neutral-900/70 border-neutral-800/80 hover:bg-neutral-800/50 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono text-xs font-semibold ${
                      isSelected ? 'text-indigo-300' : 'text-neutral-200'
                    }`}
                  >
                    {file.filename}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                    {file.category}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {file.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Code Viewer & Bugfixes breakdown */}
        <div className="md:col-span-8 flex flex-col gap-4">
          {/* Card with bugfix details */}
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>O que foi corrigido em {currentFile.filename}:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-300 pl-1">
              {currentFile.corrections.map((corr, cIdx) => (
                <li key={cIdx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{corr}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code Container */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/80">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-xs text-neutral-200 font-medium">
                  {currentFile.path}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 max-h-[460px] overflow-auto">
              <pre className="font-mono text-xs leading-relaxed text-neutral-300 whitespace-pre">
                {currentFile.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
