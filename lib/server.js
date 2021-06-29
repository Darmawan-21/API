/*

Primary file for api

*/

//Dependancies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
var config = require('../config');
var fs = require('fs');
var _data = require('./data');
var handlers = require ('./handlers');
var helpers = require ('./helpers');
var path = require('path');


var server = {};
//helpers.sendTwilioSms('87878588483', 'Halo iki', function(err){
 //   console.log('error = ',err)
//})

//start the server/ Instatiate http server
server.httpServer = http.createServer(function(req,res){
     server.unifiedServer(req,res);
  
  });
  //Log the request path
  //  console.log(`Request path ${trimedPath} with method ${method} with query string`, queryStringObj);
    //console.log(`headers `, headers);

 // buat manggil

server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req,res){
    server.unifiedServer(req,res); 
 });


server.unifiedServer = function(req, res){
      // Parse the url
      var parsedUrl = url.parse(req.url, true);
  
      // Get the path
      var path = parsedUrl.pathname;
      var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    
      // Get the query string as an object
      var queryStringObject = parsedUrl.query;
    
      // Get the HTTP method
      var method = req.method.toLowerCase();
    
      //Get the headers as an object
      var headers = req.headers;
    
      // Get the payload,if any
      var decoder = new StringDecoder('utf-8');
      var buffer = '';
      req.on('data', function(data) {
          buffer += decoder.write(data);
      });
      req.on('end', function() {
          buffer += decoder.end();
  
          //choose the handler this request should go to
          var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
  
          // construct data object to send to handler
          var data = {
              'trimmedPath' : trimmedPath,
              'queryStringObject' : queryStringObject,
              'method' : method,
              'headers' : headers,
              'payload' : helpers.parseJsonToObject(buffer)
            };
  
            //route the request
            chosenHandler(data, function(statusCode, payload){
                // Use the status code returned from the handler, or set the default status code to 200
              statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
  
                  // Use the payload returned from the handler, or set the default payload to an empty object
               payload = typeof(payload) == 'object'? payload : {};
  
               // Convert the payload to a string
              var payloadString = JSON.stringify(payload);
              
              res.setHeader('Content-Type', 'application/json');
              res.writeHead(statusCode);
              res.end(payloadString);
              console.log('Returning response ',statusCode, payloadString);
  
            })
        
    
          // Send the response
          
    
          // Log the request/response
         
      });
}




server.router = {
    'ping' : handlers.ping,
    'hello' : handlers.hello,
    'users' : handlers.users,
    'tokens' : handlers.tokens, 
    'checks' : handlers.checks,
    'register' :handlers.register,
    'login':handlers.login
  
};


server.init = function(){
    server.httpServer.listen(config.httpPort, function(){
        console.log('server jalan di port ' + config.httpPort);
    });

   server.httpsServer.listen(config.httpsPort, function(){
        console.log('server jalan di port ' + config.httpsPort);
    }) // buat manggil
    
}

module.exports = server;