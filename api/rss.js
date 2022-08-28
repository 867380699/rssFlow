import fetch from 'node-fetch';

export default function handler(request, response) {
  const { url, name } = request.query;
  console.log(request, response);
  if (url) {
    const resp = await fetch(decodeURIComponent(origin));
    const newResp = new Response(resp.body, resp);
    newResp.headers.set('Access-Control-Allow-Origin', '*');
    return newResp; 
  }
  return response.status(200).setHeader('Access-Control-Allow-Origin', '*').send(`Hello ${name}!`);
}