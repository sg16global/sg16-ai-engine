export interface StudioNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: StudioNode[];
}

async function studioJson<T>(res: Response): Promise<T> {
  let data: { error?: string } = {};
  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'Developer studio is not on this build yet. Pull the latest branch or run npm run studio.'
          : 'Could not reach the SG16 backend. Run npm run studio from the repo root.',
      );
    }
  }
  if (!res.ok) throw new Error(data.error || 'Studio unavailable');
  return data as T;
}

export async function fetchStudioStatus() {
  const res = await fetch('/api/v1/dev-studio/status');
  return studioJson<{ enabled: boolean; root: string | null; flow: string }>(res);
}

export async function fetchStudioTree() {
  const res = await fetch('/api/v1/dev-studio/tree');
  return studioJson<{ root: string; tree: StudioNode[] }>(res);
}

export async function fetchStudioFile(path: string) {
  const res = await fetch(`/api/v1/dev-studio/file?path=${encodeURIComponent(path)}`);
  return studioJson<{ path: string; content: string }>(res);
}

export async function saveStudioFile(path: string, content: string) {
  const res = await fetch('/api/v1/dev-studio/file', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
  return studioJson<{ path: string; saved: boolean }>(res);
}

export async function askStudio(message: string, history: { role: string; content: string }[], file?: { path: string; content: string }) {
  const res = await fetch('/api/v1/dev-studio/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      filePath: file?.path,
      fileContent: file?.content,
    }),
  });
  return studioJson<{ reply: string; brain?: string }>(res);
}
