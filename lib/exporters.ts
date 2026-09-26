// CSV/JSON export of scans. Kept free of I/O so the escaping rules can be unit-tested.

export interface ScanRow {
  id: string;
  url: string;
  status: string;
  mode: string;
  createdAt: string;
  overall: number | '';
  technical: number | '';
  content: number | '';
  aeoGeo: number | '';
  performance: number | '';
  criticalIssues: number | '';
  simulated: boolean;
  leadEmail: string;
  leadName: string;
}

export const SCAN_CSV_COLUMNS: Array<keyof ScanRow> = [
  'id', 'url', 'status', 'mode', 'createdAt',
  'overall', 'technical', 'content', 'aeoGeo', 'performance',
  'criticalIssues', 'simulated', 'leadEmail', 'leadName'
];

export function scanToRow(scan: {
  id: string; url: string; status: string; mode: string; createdAt: Date | string;
  leadEmail?: string | null; leadName?: string | null; seoReport?: any; crawlData?: any;
}): ScanRow {
  const score = scan.seoReport?.score;
  const num = (v: unknown): number | '' => (typeof v === 'number' ? v : '');
  return {
    id: scan.id,
    url: scan.url,
    status: scan.status,
    mode: scan.mode,
    createdAt: new Date(scan.createdAt).toISOString(),
    overall: num(score?.overall),
    technical: num(score?.technical),
    content: num(score?.content),
    aeoGeo: num(score?.aeoGeo),
    performance: num(score?.performance),
    criticalIssues: Array.isArray(scan.seoReport?.criticalIssues) ? scan.seoReport.criticalIssues.length : '',
    simulated: scan.crawlData?.hasSimulatedData === true,
    leadEmail: scan.leadEmail ?? '',
    leadName: scan.leadName ?? ''
  };
}

// A cell that starts with = + - @ (or tab/CR) is executed as a formula when the CSV is opened in
// Excel or Sheets. Lead names and URLs are attacker-supplied, so neutralise them with a leading
// apostrophe, then apply standard RFC 4180 quoting.
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T extends object>(columns: Array<keyof T>, rows: T[]): string {
  const header = columns.map((c) => csvCell(String(c))).join(',');
  const body = rows.map((row) => columns.map((c) => csvCell((row as any)[c])).join(','));
  return [header, ...body].join('\r\n') + '\r\n';
}
