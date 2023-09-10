import fetch from 'node-fetch';
import { VercelRequest, VercelResponse } from '@vercel/node';


export default async (request: VercelRequest, response: VercelResponse) => {
  const origin = (request.query.origin||'').toString();
  if (/^https?\/\/.*/.test(origin)) {
    // const resp = await fetch(origin.toString());
    // const data = await resp.text();
    // console.log(data);
    response.redirect(origin.toString());
  }
  response.status(400)
};