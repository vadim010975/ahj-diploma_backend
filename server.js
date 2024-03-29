const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaStatic = require('koa-static');
const path = require('path');
const cors = require('@koa/cors');
const db = require('./js/db.js');

const app = new Koa();

const public = path.join(__dirname, '/public');

app.use(cors());

app.use(koaBody({
  urlencoded: true,
  multipart: true,
}));

app.use(koaStatic(public));

app.use((ctx, next) => {
  if (ctx.request.method != 'GET' || ctx.request.path != '/loadHistory') {
    next();
    return;
  }
  let data;
  try {
    const { type, text } = ctx.request.query;
    data = db.loadHistory({
      type,
      text
    });
  } catch (error) {
    ctx.response.status = 500;
    return;
  }
  ctx.response.body = data;
});


app.use((ctx, next) => {
  if (ctx.request.method !== 'POST' || ctx.request.url !== '/loadHistory/next/') {
    next();
    return;
  }
  let data;
  try {
    const { type, postDate, text } = ctx.request.body;
    data = db.loadHistory({ type, postDate, text });
  } catch (error) {
    ctx.response.status = 500;
    return;
  }
  ctx.response.body = data;
});


app.use((ctx, next) => {
  if (ctx.request.method !== 'POST' || ctx.request.url !== '/upload') {
    next();
    return;
  }
  let fileData;
  try {
    const { file } = ctx.request.files;
    const { geolocation } = ctx.request.body;
    fileData = db.add(file, geolocation);
  } catch (error) {
    console.log(error);
    ctx.response.status = 500;
    return;
  }
  ctx.response.body = fileData;
});

app.use((ctx, next) => {
  if (ctx.request.method !== 'POST' || ctx.request.url !== '/message') {
    next();
    return;
  }
  let fileData;
  try {
    const { text, geolocation } = ctx.request.body;
    fileData = db.addMessage(text, geolocation);
  } catch (error) {
    ctx.response.status = 500;
    return;
  }
  ctx.response.body = fileData;
});


app.use((ctx, next) => {
  if (ctx.request.method !== 'POST' || ctx.request.url !== '/link') {
    next();
    return;
  }
  let fileData;
  try {
    const { text, geolocation } = ctx.request.body;
    fileData = db.addLink(text, geolocation);
  } catch (error) {
    ctx.response.status = 500; 
    return;
  }
  ctx.response.body = fileData;
});

app.use((ctx, next) => {
  if (ctx.request.method !== 'POST' || ctx.request.url !== '/encrypted_message') {
    next();
    return;
  }
  let fileData;
  try {
    const { text, geolocation } = ctx.request.body;
    fileData = db.addEncryptedMessage(text, geolocation);
  } catch (error) {
    ctx.response.status = 500; 
    return;
  }
  ctx.response.body = fileData;
});

app.use((ctx, next) => {
  if (ctx.request.method !== 'POST' || ctx.request.url !== '/key') {
    next();
    return;
  }
  let data;
  try {
    const { key } = ctx.request.body;
    data = db.saveKey(key);
  } catch (error) {
    ctx.response.status = 500; 
    return;
  }
  ctx.response.body = data;
});

app.use((ctx, next) => {
  if (ctx.request.method !== 'GET' || ctx.request.url !== '/key') {
    next();
    return;
  }
  let data;
  // try {
    data = db.getKey();
  // } catch (error) {
  //   ctx.response.status = 500; 
  //   return;
  // }
  ctx.response.body = data;
});

app.use((ctx, next) => {
  if (ctx.request.method != 'POST' || ctx.request.url != '/remove') {
    next();
    return;
  }
  let data;
  try {
    const text = ctx.request.body;
    data = db.removeFolder(text);
  } catch (error) {
    ctx.response.status = 500;
    return;
  }
  ctx.response.body = data;
});

app.use((ctx, next) => {
  if (ctx.request.method !== 'GET' || ctx.request.url !== '/getinformation') {
    next();
    return;
  }
  let data;
  try {
    data = db.getInformation();
  } catch (error) {
    ctx.response.status = 500;
    return;
  }
  ctx.response.body = data;
});

const server = http.createServer(app.callback());

const port = process.env.PORT || 7070;

server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Server is listening to ' + port);
});

