
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var api = require('./routes/api');
var deploys = require('./routes/deploys');
var expressValidator = require('express-validator');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(expressValidator());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/api/:segment', api["router"]);
app.post('/api/:segment', api["router"]);

app.get('/deploys/:appId', deploys.appHome);
app.get('/deploys/:appId/login', deploys.appLoginGET);
app.post('/deploys/:appId/login', deploys.appLoginPOST);
app.get('/deploys/:appId/register', deploys.appRegisterGET);
app.post('/deploys/:appId/register', deploys.appRegisterPOST);
app.get('/deploys/:appId/logout', deploys.appLogoutGET);
app.get('/deploys/:appId/forms/:formId', deploys.appForm);
app.post('/deploys/:appId/forms/:formId', deploys.saveAppForm);
app.get('/deploys/:appId/listings/:listingId', deploys.appListing);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
