import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  X,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { UpdateInfo } from '../services/updateService';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  currentVersion: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  currentVersion,
}) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electronAPI?.onUpdaterEvent) return;

    const unsubProgress = window.electronAPI.onUpdaterEvent('updater-progress', (data: any) => {
      setIsDownloading(true);
      if (data && typeof data.percent === 'number') {
        setDownloadProgress(Math.round(data.percent));
      }
    });

    const unsubDownloaded = window.electronAPI.onUpdaterEvent('updater-downloaded', () => {
      setIsDownloading(false);
      setIsDownloaded(true);
      setDownloadProgress(100);
    });

    const unsubError = window.electronAPI.onUpdaterEvent('updater-error', (msg: any) => {
      setIsDownloading(false);
      setErrorMessage(typeof msg === 'string' ? msg : 'Erro ao baixar atualização.');
    });

    return () => {
      unsubProgress?.();
      unsubDownloaded?.();
      unsubError?.();
    };
  }, []);

  if (!isOpen || !updateInfo) return null;

  const handleStartUpdate = async () => {
    setErrorMessage(null);

    // If packaged Electron app with auto-updater support
    if (window.electronAPI?.downloadUpdate) {
      setIsDownloading(true);
      setDownloadProgress(0);
      const res = await window.electronAPI.downloadUpdate();
      if (res?.error) {
        setIsDownloading(false);
        setErrorMessage(res.error);
        // Fallback: open release page
        if (updateInfo.downloadUrl) {
          window.open(updateInfo.downloadUrl, '_blank');
        }
      }
    } else {
      // In web or portable environment, open direct download / release URL
      const targetUrl = updateInfo.downloadUrl || updateInfo.htmlUrl;
      if (targetUrl) {
        window.open(targetUrl, '_blank');
      }
    }
  };

  const handleInstallAndRestart = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header with vibrant gradient */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                Atualização Disponível
              </span>
              <h3 className="text-xl font-black tracking-tight text-white">
                Nova Versão do Sistema
              </h3>
            </div>
          </div>

          {/* Versions Comparison Pill */}
          <div className="mt-4 flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/10 text-xs font-bold">
            <span className="text-slate-300">Versão Atual: <strong className="text-white">v{currentVersion}</strong></span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="text-emerald-300">Nova: <strong className="text-white px-2 py-0.5 rounded-lg bg-emerald-500/30 border border-emerald-400/40">{updateInfo.version}</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[50vh]">
          {/* Release Notes */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              O que há de novo nesta versão:
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap max-h-48 overflow-y-auto">
              {updateInfo.releaseNotes || 'Correções de estabilidade e novas funcionalidades implementadas.'}
            </div>
          </div>

          {/* Progress / Status feedback */}
          {isDownloading && (
            <div className="space-y-2 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Baixando atualização...
                </span>
                <span>{downloadProgress ?? 0}%</span>
              </div>
              <div className="w-full bg-indigo-200/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, downloadProgress ?? 0)}%` }}
                />
              </div>
            </div>
          )}

          {isDownloaded && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Download concluído! Ao reiniciar, a nova versão será aplicada automaticamente mantendo todos os seus dados intactos.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Security Guarantee */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Seus dados locais, cadastros e lançamentos permanecem 100% seguros e preservados.</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            Lembrar Mais Tarde
          </button>

          <div className="flex items-center gap-2">
            {isDownloaded ? (
              <button
                type="button"
                onClick={handleInstallAndRestart}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                <span>Reiniciar & Instalar Agora</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartUpdate}
                disabled={isDownloading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Baixando...' : 'Atualizar Sistema Agora'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
