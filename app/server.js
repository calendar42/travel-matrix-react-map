/*
  Middleware
*/
var proxy = require('express-http-proxy');
var path = require('path');
/*
  Server
*/
var express = require('express');
var app = express();
var server = require('http').Server(app);

server.listen(8042);
app.use('/static/css', express.static(path.resolve(__dirname + '/../app/build/static/css')));
app.use('/static/images', express.static(path.resolve(__dirname + '/../app/build/static/images')));
app.use('/static/js', express.static(path.resolve(__dirname + '/../app/build/static/js')));
app.use('/static/media', express.static(path.resolve(__dirname + '/../app/build/static/media')));

// CATCHING all unmatched calls towards the index
// !!!!!!!!!!!!!!!!!!!!!!
// The order is important
// !!!!!!!!!!!!!!!!!!!!!!
app.use(function(req, res){
  res.sendFile(path.resolve(__dirname + '/../app/build/index.html'));
});
