var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require("morgan");
var http = require('http');
var request = require('request');
var uuid = require('node-uuid');
var registered_services = []
var registered_ids = []
var queries = {};

var app = express();

var BroadcastManager = function(okCallback, noCallback){
    var results = [];
    if(registered_ids.length == 0){
        noCallback();
        return;
    }
    registered_ids.forEach(function(id){
        results.push[""];
    });
    this.update = function(id, status){
      results[registered_ids.indexOf(id)] = status;
        if(results.indexOf("") == -1){
            if(results.indexOf("OK") == -1){
              noCallback();
            } else {
              okCallback();
            }
        }
    }
};


app.set('port', 8888);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/*
To register a new microservice with the coordinator
send a POST request to "/register" with the body containing the json object:
{
    id: "some unique identifier"
    host:"www.whatever.com"
    port:"99"
}
*/
/*
TODO:
Check for id uniqueness
*/
app.post('/register',function(req,res){
    var id = req.body.id;
    var service = {
        'id': id,
        'host': req.body.host,
        'port': req.body.port
    }
    registered_services.push(service);
    registered_ids.push(id);
    res.send(200);
});

/*
A query request is a json document with two parts 
{
sender: the url of the sender
query: we're still figuring the speifics, but it better have an id
}
*/
app.get('/query',function(req,res){
    console.log("query received");
    queries[req.body.query.id] = {sender: req.body.sender};
    var query = req.body.query;
    var broadcast = new BroadcastManager(function(){res.send(202)}, function(){res.send(400)});
    registered_services.forEach(function(registree){
        var url = "http://"+registree.host+":"+registree.port;
        request.post(url, {json:req.body.query},function(err, response, body){
          if(response.statusCode == 202){
            broadcast.update(registree.id, "OK");
          } else {
            broadcast.update(registree.id, "NO");
          }
        });
    });
});
    
app.get('/query/:id', function(req, res){
    var body = queries[req.param('id')].solution(function(err,answer){
        if(err){
            res.send(400);
        } else {
            res.send(200, answer);
        }
    })    
});
     

http.createServer(app).listen(app.get('port'), function(){
   console.log('Express server listening on port ' + app.get('port'));
 });
