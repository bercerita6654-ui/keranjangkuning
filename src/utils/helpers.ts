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

export const isNewUpdate = (dateStr: string | null | undefined): boolean => {
  if (!dateStr || dateStr === '-') return false;
  try {
    const parts = dateStr.split(' ')[0].split(/[-/]/);
    let d: Date;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else {
      d = new Date(dateStr);
    }
    
    if (isNaN(d.getTime())) return false;
    const diffDays = Math.ceil(Math.abs(new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24)); 
    return diffDays <= 7;
  } catch (e) {
    return false;
  }
};
