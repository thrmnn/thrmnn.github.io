export const series = [
  { id: 'proof', name: 'Proof', line: 'PLACEHOLDER' },
  { id: 'build-log', name: 'Build log', line: 'PLACEHOLDER' },
  { id: 'seeing', name: 'Seeing', line: 'PLACEHOLDER' },
] as const;

export const seriesIds = series.map((s) => s.id) as [string, ...string[]];

export const seriesName = (id: string) => series.find((s) => s.id === id)?.name ?? id;
