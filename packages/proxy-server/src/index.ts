import * as Koa from 'koa';
import * as Router from 'koa-router';
import axios from 'axios';

const app = new Koa();

const router = new Router();

const proxy = async (ctx: Koa.Context) => {
  console.log(ctx.params.url);
  const response = await axios.get(ctx.params.url, {responseType: 'stream'});
  ctx.response.set('content-type', response.headers['content-type']);
  ctx.response.set('Access-Control-Allow-Origin', '*');
  ctx.body = response.data;
}

router.get('/', (ctx) => {
  ctx.body = 'Hello World';
}).get('/rss/:url', proxy).get('/img/:url', proxy);

app.use(router.routes()).use(router.allowedMethods());

app.listen(2999);
