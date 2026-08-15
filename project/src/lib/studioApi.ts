export interface StudioNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: StudioNode[];
}

export async function fetchStudioStatus() {
  const res = await fetch('/api/v1/dev-studio/status');
  return res.json() as Promise<{ enabled: boolean; root: string | null; flow: string }>;
}

export async function fetchStudioTree() {
  const res = await fetch('/api/v1/dev-studio/tree');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Tree unavailable');
  return data as { root: string; tree: StudioNode[] };
}

export async function fetchStudioFile(path: string) {
  const res = await fetch(`/api/v1/dev-studio/file?path=${encodeURIComponent(path)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Read failed');
  return data as { path: string; content: string };
}

export async function saveStudioFile(path: string, content: string) {
  const res = await fetch('/api/v1/dev-studio/file', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Save failed');
  return data as { path: string; saved: boolean };
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Developer unavailable');
  return data as { reply: string; brain?: string };
}
