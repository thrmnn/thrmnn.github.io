import { trackFigure } from '../../data/figures';

export function GET() {
  return new Response(JSON.stringify(trackFigure().data), { headers: { 'content-type': 'application/json' } });
}
