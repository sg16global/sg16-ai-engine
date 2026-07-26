export type CodingReport = {
  id: string;
  title: string;
  language: string;
  errors: number;
  score: number;
  date: string;
};

const KEY = 'sg16_coding_reports_v1';

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

export function guessLanguage(code: string): string {
  if (/def |import |print\(/.test(code)) return 'Python';
  if (/function |const |=>|interface /.test(code)) return 'TypeScript';
  if (/public class |System\.out/.test(code)) return 'Java';
  if (/#include|int main\(/.test(code)) return 'C++';
  return 'Code';
}
