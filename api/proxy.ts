import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async (request: VercelRequest, response: VercelResponse) => {
  const origin = (request.query.origin || '').toString();
  console.log(origin);
  if (/^https?:\/\/.*/.test(origin)) {
    const resp = await fetch(origin.toString());

    for (let [k, v] of Object.entries(resp.headers)){
      if (v) {
        response.setHeader(k, v);
      }
    }

    resp.body?.pipe(response);
  } else {
    response.status(404).send('404');
  }
};