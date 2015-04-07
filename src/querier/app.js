var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var request= require('request');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


io.on('connection',function(socket){
    console.log("socket connected");
    socket.on('query', function(query){
        request.get("http://localhost:3081"+"/query", {json:{sender: "http://localhost:3080", query:query}}, function(err,response,body){
            if(err){
              console.log(err);
            }
            console.log(response.statusCode);
            if(response.statusCode == 202){
              socket.send('statusMessage', "Your query may be completable"); 
            } else {
                console.log("sending status message");
                io.emit('statusMessage', "Your query cannot be completed"); 
            }

        });      
    });
});

// view engine setup
app.set('port', parseInt(process.argv[2]))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

http.listen(app.get('port'), function(){
  console.log('listening on ' + app.get('port'));
});

module.exports = app;
