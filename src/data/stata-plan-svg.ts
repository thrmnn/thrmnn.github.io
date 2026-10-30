// The Practice floor plan as SVG markup, shared by the homepage (StataPlan.astro) and the
// portfolio PDF's cover, so both draw the same stretch from src/data/stata-plan.json.
type Pt = [number, number];
export type Plan = { crop_m: number[]; error_end_m: number; sigma_cm: number[]; walls_dm: Pt[]; said: Pt[]; was: Pt[] };

const PX = 10;

export function planSvg(plan: Plan): string {
  const [x0, x1, y0, y1] = plan.crop_m;
  const W = (x1 - x0) * PX, H = (y1 - y0) * PX;
  const X = (x: number) => ((x - x0) * PX).toFixed(1);
  const Y = (y: number) => ((y1 - y) * PX).toFixed(1);
  const line = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${X(x)} ${Y(y)}`).join('L');
  const walls = plan.walls_dm.map(([cx, cy]) => `M${cx} ${cy}h0`).join('');
  const [wx, wy] = plan.was[plan.was.length - 1];
  const [sx, sy] = plan.said[plan.said.length - 1];
  const mx = ((wx + sx) / 2 - x0) * PX, my = (y1 - (wy + sy) / 2) * PX;
  const [s0, s1] = plan.sigma_cm;
  const e = plan.error_end_m;
  const bar = 10 * PX;
  return `<svg class="plan" viewBox="0 0 ${W} ${H}" role="img" aria-label="Floor plan: the robot's real path and the path it reported, ${e} metres apart">
  <path class="walls" d="${walls}"/>
  <path class="gap" d="M${X(wx)} ${Y(wy)}L${X(sx)} ${Y(sy)}"/>
  <path class="was" d="${line(plan.was)}"/>
  <path class="said" d="${line(plan.said)}"/>
  <circle class="was-dot" cx="${X(wx)}" cy="${Y(wy)}" r="5"/>
  <circle class="said-dot" cx="${X(sx)}" cy="${Y(sy)}" r="5"/>
  <text class="lab big" x="${(mx + 10).toFixed(1)}" y="${(my + 6).toFixed(1)}">${e} m</text>
  <text class="lab" x="${(Number(X(wx)) + 12).toFixed(1)}" y="${(Number(Y(wy)) + 4).toFixed(1)}">where it was</text>
  <text class="lab said-lab" x="${(Number(X(sx)) + 12).toFixed(1)}" y="${(Number(Y(sy)) - 8).toFixed(1)}">where it said it was,</text>
  <text class="lab said-lab" x="${(Number(X(sx)) + 12).toFixed(1)}" y="${(Number(Y(sy)) + 10).toFixed(1)}">sure to ${s0}–${s1} cm</text>
  <path class="bar" d="M${W - bar - 8} ${H - 10}h${bar}"/>
  <text class="tick" x="${W - 8}" y="${H - 16}" text-anchor="end">10 m</text>
</svg>`;
}
