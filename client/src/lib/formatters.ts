import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: string | number): string {
  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/\./g, "").replace(",", "."))
    : value;
  if (isNaN(numericValue)) return "R$ 0,00";
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    // If it's a timestamp
    if (dateString.includes('T')) {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    }
    // If it's just a YYYY-MM-DD string
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = dateString.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
}

export function parseNumberString(val: string | number | undefined | null): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const normalized = val.trim().replace(/\s+/g, "");
  const parsed = normalized.includes(",")
    ? parseFloat(normalized.replace(/\./g, "").replace(",", "."))
    : parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
