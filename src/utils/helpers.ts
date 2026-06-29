export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [""];
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

export function parsePrice(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID');
}

export function formatRupiah(num: number): string {
  return `Rp ${formatNumber(num)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToValuesString(r: number, g: number, b: number): string {
  return `${r} ${g} ${b}`;
}

export function mixColor(
  rgb: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  factor: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(rgb.r + (target.r - rgb.r) * factor),
    g: Math.round(rgb.g + (target.g - rgb.g) * factor),
    b: Math.round(rgb.b + (target.b - rgb.b) * factor),
  };
}

export function getFormattedDate(): string {
  const dateObj = new Date();
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === '-') return null;
  const cleanStr = dateStr.trim();
  const spaceParts = cleanStr.split(/\s+/);
  const datePart = spaceParts[0];
  const timePart = spaceParts[1] || '';
  
  const dateSubparts = datePart.split(/[-/]/);
  if (dateSubparts.length !== 3) {
    const native = new Date(cleanStr);
    return isNaN(native.getTime()) ? null : native;
  }
  
  let year = 0;
  let month = 0;
  let day = 0;
  
  if (dateSubparts[0].length === 4) {
    year = parseInt(dateSubparts[0], 10);
    month = parseInt(dateSubparts[1], 10) - 1;
    day = parseInt(dateSubparts[2], 10);
  } else {
    day = parseInt(dateSubparts[0], 10);
    month = parseInt(dateSubparts[1], 10) - 1;
    year = parseInt(dateSubparts[2], 10);
  }
  
  let hour = 0;
  let minute = 0;
  let second = 0;
  
  if (timePart) {
    const timeSubparts = timePart.split(/[:.]/);
    if (timeSubparts.length >= 1) hour = parseInt(timeSubparts[0], 10) || 0;
    if (timeSubparts.length >= 2) minute = parseInt(timeSubparts[1], 10) || 0;
    if (timeSubparts.length >= 3) second = parseInt(timeSubparts[2], 10) || 0;
  }
  
  const d = new Date(year, month, day, hour, minute, second);
  return isNaN(d.getTime()) ? null : d;
}

export const isNewUpdate = (dateStr: string | null | undefined): boolean => {
  if (!dateStr || dateStr === '-') return false;
  try {
    const d = parseDate(dateStr);
    if (!d) return false;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    // 24 hours = 24 * 60 * 60 * 1000 = 86400000 ms
    // We allow a negative difference of up to 12 hours to handle potential timezone shifts
    return diffMs <= 86400000 && diffMs >= -43200000;
  } catch (e) {
    return false;
  }
};

export function getGoogleDriveThumbnail(imgId: string | null | undefined, size: number = 320): string {
  if (!imgId || imgId === '-') {
    return `https://placehold.co/${size}x${size}/f8fafc/94a3b8?text=No+Img`;
  }
  // drive.google.com/thumbnail has a highly cached, responsive CDN optimized for rendering speed.
  // Using &sz=w{size} fetches pre-rendered images which load instantly.
  return `https://drive.google.com/thumbnail?id=${imgId}&sz=w${size}`;
}

