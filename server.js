var PORT = process.env.PORT || 3000;
var CACHE_MAX = process.env.NODE_ENV === "production" ? 86400000 : 0;// 24 hours in prod only
var express = require('express');
var serveStatic = require('serve-static');

var app = express();
app.use(serveStatic(__dirname, {maxAge: CACHE_MAX}));
app.listen(PORT);
console.log("app started on port " + PORT);