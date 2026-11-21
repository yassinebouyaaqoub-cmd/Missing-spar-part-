export interface SplitReference {
  raw: string;
  mold: string;
  insert: string;
  shortName: string;
  fullPath: string;
}

export function getTodayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function buildShortName(mold: string, insert: string): string {
  const m = mold.trim();
  const i = insert.trim();
  if (!m && !i) return '';
  if (!i) return `${m}.pdf`;
  if (!m) return `${i}.pdf`;
  return `${m}-${i}.pdf`;
}

export function buildFullPath(mold: string, insert: string): string {
  const m = mold.trim();
  const i = insert.trim();
  if (!m && !i) return '';
  const shortName = buildShortName(m, i);
  if (!i) {
    return `Y:/18.%20Molds/${m}/Plans/${shortName}`;
  }
  return `Y:/18.%20Molds/${m}/${i}/Plans/${shortName}`;
}

export function splitReference(reference: string): SplitReference {
  const cleaned = reference.trim();
  if (!cleaned) {
    return {
      raw: '',
      mold: '',
      insert: '',
      shortName: '',
      fullPath: '',
    };
  }

  const lastDashIdx = cleaned.lastIndexOf('-');
  let mold = cleaned;
  let insert = '';

  if (lastDashIdx > 0 && lastDashIdx < cleaned.length - 1) {
    mold = cleaned.slice(0, lastDashIdx).trim();
    insert = cleaned.slice(lastDashIdx + 1).trim();
  }

  return {
    raw: cleaned,
    mold,
    insert,
    shortName: buildShortName(mold, insert),
    fullPath: buildFullPath(mold, insert),
  };
}

export function parseReferenceLines(input: string): SplitReference[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(splitReference)
    .filter((item) => item.mold.length > 0);
}
