var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require("morgan");
var http = require('http');
var request = require('request');
var uuid = require('node-uuid');

var app = express();

app.set('port', parseInt(process.argv[2]) || 3083);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.post('/query',function(req,res){
    
    console.log(req.body.id);
    if(req.body.query == 'top songs'){      
        res.sendStatus(202);
        topSongsHandler(req);
    }
    //Could add more requests for more functionality support.
    else{
        res.sendStatus(400);
    }
});

var topSongsHandler = function(req,res){
    var spotifyUrl ="http://charts.spotify.com/api/tracks/most_streamed/global/daily/latest";
    var topSongs=[];
    request.get(spotifyUrl, function(err, response, body){
        var jsonRes = JSON.parse(body).tracks;
        for (var i in jsonRes) {      
            if (jsonRes[i].hasOwnProperty("track_name")) {
                topSongs.push({
                    "track_name":jsonRes[i].track_name,
                    "artist_name":jsonRes[i].artist_name,
                    "album_name":jsonRes[i].album_name
                });
            }
        }
        var responseFinal = {"id": req.body.id, "query":req.body.query, "data": topSongs};
        request.post("http://localhost:3081/response").json(responseFinal);
        console.log(JSON.stringify(responseFinal));
    });
}

//Spotify in this prototype will not need a response...
app.post('/response', function(req, res){
    res.send(200);
    console.log(req.body.id);
});  

http.createServer(app).listen(app.get('port'), function(){
   console.log('Express server listening on port ' + app.get('port'));
 });
