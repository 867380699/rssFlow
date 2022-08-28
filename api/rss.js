export default function handler(request, response) {
  const { name } = request.query;
  const { search } = new URL(request.url);
  console.log(request);
  if (search) {
    const queryParams = JSON.parse('{"' + decodeURI(search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    if (queryParams) {
      const { origin } = queryParams;
      if (origin) {
        const resp = await fetch(decodeURIComponent(origin));
        const newResp = new Response(resp.body, resp);
        newResp.headers.set('Access-Control-Allow-Origin', '*');
        return newResp;
      }
    }
  }
  response.status(200).send(`Hello ${name}!`);
}