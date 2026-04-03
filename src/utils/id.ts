export function randomId(prefix: string): string {
  const seed = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${seed}`;
}
