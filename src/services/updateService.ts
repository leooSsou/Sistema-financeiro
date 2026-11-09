export interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
  htmlUrl?: string;
  downloadUrl?: string;
  isPackagedElectron?: boolean;
}

export function isNewerVersion(latest: string, current: string): boolean {
  const cleanL = latest.replace(/^v/i, '').trim();
  const cleanC = current.replace(/^v/i, '').trim();
  if (!cleanL || !cleanC || cleanL === cleanC) return false;

  const lParts = cleanL.split('.').map((p) => parseInt(p, 10) || 0);
  const cParts = cleanC.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

const GITHUB_REPO = 'leooSsou/Sistema-financeiro';
export const CURRENT_APP_VERSION = '1.0.0';

export async function checkGitHubRelease(currentVersion = CURRENT_APP_VERSION): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        // No releases published yet
        return null;
      }
      return null;
    }

    const data = await res.json();
    const latestTag = data.tag_name || data.name || '';
    if (!latestTag) return null;

    if (isNewerVersion(latestTag, currentVersion)) {
      // Find asset download url for current platform if available
      let downloadUrl = data.html_url;
      if (Array.isArray(data.assets) && data.assets.length > 0) {
        const platform = navigator.userAgent.toLowerCase();
        const preferredAsset = data.assets.find((a: any) => {
          const name = (a.name || '').toLowerCase();
          if (platform.includes('win') && (name.endsWith('.exe') || name.includes('win'))) return true;
          if (platform.includes('linux') && (name.endsWith('.appimage') || name.endsWith('.deb'))) return true;
          return false;
        });
        if (preferredAsset?.browser_download_url) {
          downloadUrl = preferredAsset.browser_download_url;
        }
      }

      return {
        version: latestTag.startsWith('v') ? latestTag : `v${latestTag}`,
        releaseNotes: data.body || 'Melhorias de desempenho e novidades no sistema.',
        releaseDate: data.published_at,
        htmlUrl: data.html_url,
        downloadUrl,
      };
    }

    return null;
  } catch (err) {
    console.warn('[UpdateService] Não foi possível consultar releases do GitHub:', err);
    return null;
  }
}
