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
    var sent = false;
    if(registered_ids.length == 0){
        noCallback();
        return;
    }
    registered_ids.forEach(function(id){
        results.push[""];
    });
    this.update = function(id, status){
      results[registered_ids.indexOf(id)] = status;
        if(results.indexOf("") == -1 && !sent){
            if(results.indexOf("OK") == -1){
              noCallback();
            } else {
              okCallback();
            }
            sent = true;
        }
    }
};


app.set('port', parseInt(process.argv[2]) || 3081);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/*
To register a new microservice with the coordinator
send a POST request to "/register" with the body containing the json object:
{
    url: a url to access the service with
}
*/
app.post('/register',function(req,res){
    //generate your own id
    var id = uuid.v1();
    var service = {
        'id': id,
        'url':req.body.url
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
    console.log(req.body.id);
    queries[req.body.id] = {sender: req.body.sender};
    var q = req.body;
    var broadcast = new BroadcastManager(function(){res.send(202)}, function(){res.send(400)});
    registered_services.forEach(function(registree){
        var url = "http://"+registree.url+"/query";
        request.post(url, {json:q},function(err, response, body){
          if(response.statusCode == 202){
            broadcast.update(registree.id, "OK");
          } else {
            broadcast.update(registree.id, "NO");
          }
        });
    });
});
    
app.post('/response', function(req, res){
    res.send(200);
    console.log(queries[req.body.id].sender);
    var url = queries[req.body.id].sender+'/response';
    request.post(url, {json:req.body},function(err,response,body){});
});
     

http.createServer(app).listen(app.get('port'), function(){
   console.log('Express server listening on port ' + app.get('port'));
 });
