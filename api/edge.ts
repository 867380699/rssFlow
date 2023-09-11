import type { RequestContext } from '@vercel/edge';
 
export const config = {
  runtime: 'edge',
};
 
export default async function MyEdgeFunction(
  request: Request,
  context: RequestContext,
) {
  const url = new URL(request.url);
  const origin = url.searchParams.get('origin') || '';
  if (/^https?:\/\/.*/.test(origin)) {
    const resp = await fetch(origin);
    return resp.clone();
  } else {
    return new Response(`Hello, from ${request.url} I'm an Edge Function!`);
  }
}