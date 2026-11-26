import { stataReplay } from '../../data/stataReplay';

export function GET() {
  return new Response(JSON.stringify(stataReplay()), { headers: { 'content-type': 'application/json' } });
}
