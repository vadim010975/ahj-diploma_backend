const fs = require('fs');
const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaStatic = require('koa-static');
const path = require('path');
const { v4 } = require('uuid');
const cors = require('@koa/cors');
const { streamEvents } = require('http-event-stream');
const db = require('./js/db.js');
const { accessSync, constants } = require('node:fs');

let lastFolder;

const app = new Koa();

const public = path.join(__dirname, '/public');

app.use(cors());

app.use(koaBody({
  urlencoded: true,
  multipart: true,
}));

app.use(koaStatic(public));

app.use((ctx, next) => {
  if (ctx.request.method !== 'GET' || ctx.request.url !== '/loadHistory') {
    next();
    
    return;
  }
  
  let data;

  try {
    data = db.loadHistory();

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
    const text = ctx.request.body;

    data = db.loadHistory(text);

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

  // console.log(ctx.request.body);
  // console.log(ctx.request.files);

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
  if (ctx.request.method !== 'POST' || ctx.request.url !== '/remove') {
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
  if (ctx.request.method !== 'GET' || ctx.request.path !== '/find') {
    next();
    
    return;
  }

  let data;

  try {

    const text = ctx.request.query.text;

    data = db.filter(text);

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

