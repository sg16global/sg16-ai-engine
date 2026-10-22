export type CodingReport = {
  id: string;
  title: string;
  language: string;
  errors: number;
  score: number;
  date: string;
};

const KEY = 'sg16_coding_reports_v1';

const LANGUAGE_NAMES: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
};

/** Display name for a Coding Shield language id (javascript → JavaScript). */
export function languageName(lang: string) {
  return LANGUAGE_NAMES[lang] || lang;
}

export function loadCodingReports(): CodingReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CodingReport[];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

export function saveCodingReport(report: Omit<CodingReport, 'id' | 'date'>) {
  const next: CodingReport = {
    ...report,
    id: `${Date.now()}`,
    date: new Date().toLocaleDateString(),
  };
  const all = [next, ...loadCodingReports()].slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}
