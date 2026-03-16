export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string, fieldName: string): Date {
  if (!DATE_ONLY_REGEX.test(value)) {
    throw new HttpError(400, `${fieldName} deve estar no formato YYYY-MM-DD`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${fieldName} invalida`);
  }

  return parsed;
}

export function ensureDateOrder(startDate: string, endDate: string, startLabel: string, endLabel: string) {
  const start = parseDateOnly(startDate, startLabel);
  const end = parseDateOnly(endDate, endLabel);

  if (end < start) {
    throw new HttpError(400, `${endLabel} nao pode ser menor que ${startLabel}`);
  }
}

export function parseMoney(value: string | number, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, `${fieldName} invalido`);
  }
  return parsed;
}

export function startOfTodayUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
