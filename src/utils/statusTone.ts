// Map a free-form project status string to a StatusPill tone.
// Phase 4.7 sprint 2026-05-14 — Marina: keep the five-accent palette
// from collapsing to graphite by routing pills through lifecycle keywords.
//
// Order matters: first matching keyword wins.

type Tone = 'graphite' | 'terra' | 'cool-grey' | 'oxblood';

const RULES: { match: RegExp; tone: Tone }[] = [
  // Submitted / under review — peer-review limbo. Terra.
  { match: /\b(submitted|under review|in review)\b/i, tone: 'terra' },

  // Published / public release — landed. Oxblood.
  { match: /\b(published|public release|released|live|shipped|accepted)\b/i, tone: 'oxblood' },

  // Archived / sunset — past tense. Cool-grey.
  { match: /\b(archived|sunset|paused|abandoned|deprecated)\b/i, tone: 'cool-grey' },

  // Ongoing / active — default forward-motion. Graphite.
  // (also the fallback)
  { match: /\b(ongoing|active|in progress|wip)\b/i, tone: 'graphite' },
];

export function statusTone(status: string | undefined | null): Tone {
  if (!status) return 'graphite';
  for (const rule of RULES) {
    if (rule.match.test(status)) return rule.tone;
  }
  return 'graphite';
}
