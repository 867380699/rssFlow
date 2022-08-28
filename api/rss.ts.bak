import fetch from 'node-fetch';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (request: VercelRequest, response: VercelResponse) => {
  const { url, name } = request.query;
  console.log(request, response);
  if (url) {
    const resp = await fetch(decodeURIComponent(url.toString()));
    return response.status(200).setHeader('Access-Control-Allow-Origin', '*').send(resp.body);
  }
  return response.status(200).setHeader('Access-Control-Allow-Origin', '*').send(`Hello ${name}!`);
};