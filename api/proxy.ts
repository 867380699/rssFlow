import fetch from 'node-fetch';
import { VercelRequest, VercelResponse } from '@vercel/node';


export default async (request: VercelRequest, response: VercelResponse) => {
  const origin = (request.query.origin || '').toString();
  console.log(origin);
  if (/^https?:\/\/.*/.test(origin)) {
    const resp = await fetch(origin.toString());
    const data = await resp.text();
    // console.log(data);
    response.status(200).send(data);
  } else {
    response.status(404).send('404');
  }
};