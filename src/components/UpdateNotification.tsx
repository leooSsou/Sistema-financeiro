import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, RefreshCw, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

interface ProgressInfo {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

export const UpdateNotification: React.FC = () => {
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
  >('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api || !api.onUpdaterEvent) return;

    const unsubs = [
      api.onUpdaterEvent('updater-checking', () => {
        setStatus('checking');
      }),
      api.onUpdaterEvent('updater-available', (info: UpdateInfo) => {
        setUpdateInfo(info);
        setStatus('available');
        setDismissed(false);
      }),
      api.onUpdaterEvent('updater-not-available', () => {
        if (status === 'checking') setStatus('idle');
      }),
      api.onUpdaterEvent('updater-progress', (prog: ProgressInfo) => {
        setProgress(prog);
        setStatus('downloading');
      }),
      api.onUpdaterEvent('updater-downloaded', (info: UpdateInfo) => {
        setUpdateInfo(info);
        setStatus('downloaded');
        setDismissed(false);
      }),
      api.onUpdaterEvent('updater-error', (err: string) => {
        setErrorMessage(err || 'Falha ao buscar atualizações.');
        setStatus('error');
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, [status]);

  const handleDownload = async () => {
    if (!window.electronAPI?.downloadUpdate) return;
    setStatus('downloading');
    try {
      const res = await window.electronAPI.downloadUpdate();
      if (!res.success && res.error) {
        setErrorMessage(res.error);
        setStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao baixar atualização.');
      setStatus('error');
    }
  };

  const handleInstall = () => {
    if (window.electronAPI?.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  if (dismissed || status === 'idle' || status === 'checking') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 border border-emerald-500/30 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-slate-100">
                  {status === 'downloaded' ? 'Atualização Pronta!' : 'Nova Versão Disponível'}
                </h4>
                {updateInfo?.version && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
                    v{updateInfo.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {status === 'available' && 'Uma nova atualização do FinanPro Suite está pronta para download.'}
                {status === 'downloading' && 'Baixando nova versão em segundo plano...'}
                {status === 'downloaded' && 'O download foi concluído. Reinicie o aplicativo para aplicar.'}
                {status === 'error' && errorMessage}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white transition-colors p-1"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {status === 'downloading' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Baixando atualização...</span>
              <span className="font-semibold text-emerald-400">
                {progress ? `${Math.round(progress.percent)}%` : 'Iniciando...'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress ? progress.percent : 5}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex items-center justify-end gap-2">
          {status === 'available' && (
            <>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              >
                Depois
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg shadow-sm transition-all active:scale-95"
              >
                <ArrowDownCircle className="w-4 h-4" />
                Atualizar Agora
              </button>
            </>
          )}

          {status === 'downloaded' && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-95 text-slate-950 font-bold rounded-lg shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Reiniciar e Instalar
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
