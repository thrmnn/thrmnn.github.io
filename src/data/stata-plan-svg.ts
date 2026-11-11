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

// Phone drawing: the map cropped to the two paths, labels in a column beside it (same as
// theohermann.ch, 4716493). A viewBox cannot change per breakpoint, hence a second drawing.
export function planSvgSmall(plan: Plan): string {
  const [x0, , , y1] = plan.crop_m;
  const e = plan.error_end_m;
  const [s0, s1] = plan.sigma_cm;
  const pts = [...plan.was, ...plan.said];
  const cx0 = Math.min(...pts.map((p) => p[0])) - 2, cx1 = Math.max(...pts.map((p) => p[0])) + 2;
  const cy0 = Math.min(...pts.map((p) => p[1])) - 2, cy1 = Math.max(...pts.map((p) => p[1])) + 2;
  const SH = 176, k = SH / (cy1 - cy0), SW = (cx1 - cx0) * k, VW = 340, LX = SW + 22;
  const sx_ = (x: number) => (x - cx0) * k, sy_ = (y: number) => (cy1 - y) * k;
  const sline = (p: Pt[]) => 'M' + p.map(([x, y]) => `${sx_(x).toFixed(1)} ${sy_(y).toFixed(1)}`).join('L');
  const swalls = [...new Set(plan.walls_dm
    .map(([cx, cy]) => [x0 + cx / PX, y1 - cy / PX])
    .filter(([x, y]) => x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1)
    .map(([x, y]) => `M${Math.round(sx_(x))} ${Math.round(sy_(y))}h0`))].join('');
  const [wx, wy] = plan.was[plan.was.length - 1];
  const [sx, sy] = plan.said[plan.said.length - 1];
  const [wX, wY, sX, sY] = [sx_(wx), sy_(wy), sx_(sx), sy_(sy)];
  return `<svg class="plan plan-sm" viewBox="0 0 ${VW} ${SH}" role="img" aria-label="Floor plan: the robot's real path and the path it reported, ${e} metres apart">
  <path class="walls" d="${swalls}"/>
  <path class="gap" d="M${wX.toFixed(1)} ${wY.toFixed(1)}L${sX.toFixed(1)} ${sY.toFixed(1)}"/>
  <path class="was" d="${sline(plan.was)}"/>
  <path class="said" d="${sline(plan.said)}"/>
  <path class="lead" d="M${(wX + 7).toFixed(1)} ${wY.toFixed(1)}H${LX - 6}"/>
  <path class="lead said-lead" d="M${(sX + 7).toFixed(1)} ${sY.toFixed(1)}H${LX - 6}"/>
  <circle class="was-dot" cx="${wX.toFixed(1)}" cy="${wY.toFixed(1)}" r="4"/>
  <circle class="said-dot" cx="${sX.toFixed(1)}" cy="${sY.toFixed(1)}" r="4"/>
  <text class="lab big" x="${((wX + sX) / 2 + 8).toFixed(1)}" y="${((wY + sY) / 2 + 7).toFixed(1)}">${e} m</text>
  <text class="lab" x="${LX}" y="${(wY + 5).toFixed(1)}">where it was</text>
  <text class="lab said-lab" x="${LX}" y="${(sY - 13).toFixed(1)}">where it said it was,</text>
  <text class="lab said-lab" x="${LX}" y="${(sY + 5).toFixed(1)}">sure to ${s0}–${s1} cm</text>
  <path class="bar" d="M${LX} ${((wY + sY) / 2).toFixed(1)}h${(10 * k).toFixed(1)}"/>
  <text class="tick" x="${LX + 10 * k + 6}" y="${((wY + sY) / 2 + 4).toFixed(1)}">10 m</text>
</svg>`;
}
