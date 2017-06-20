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


app.use('/proxy/google/', proxy("https://maps.googleapis.com/maps/api/geocode/json", {
  proxyReqPathResolver: function(req, res) {
    req.url += "&key="+process.env.GOOGLE_API_KEY;
    return "https://maps.googleapis.com/maps/api/geocode/json" + require('url').parse(req.url).path.substring(1);
  }
}));

app.use('/proxy/flickbike/', proxy("https://app.flick.bike/FlickBike/app/bike?industryType=2&lat=52.389040&lng=4.889559&requestType=30001", {
  proxyReqPathResolver: function(req, res) {
    return "https://app.flick.bike/FlickBike/app/bike?industryType=2&lat=52.389040&lng=4.889559&requestType=30001" + require('url').parse(req.url).path.substring(1);
  }
}));

// CATCHING all unmatched calls towards the index
// !!!!!!!!!!!!!!!!!!!!!!
// The order is important
// !!!!!!!!!!!!!!!!!!!!!!
app.use(function(req, res){
  res.sendFile(path.resolve(__dirname + '/../app/build/index.html'));
});
