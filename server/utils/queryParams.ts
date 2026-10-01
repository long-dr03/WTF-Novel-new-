export function boundedInteger(value: unknown, fallback: number, max: number): number {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export function literalSearch(value: unknown): string {
    return String(value ?? '').trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
