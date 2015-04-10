var express = require('express'),
    request = require('request')

var app = express(),
    port = parseInt(process.argv[2]) || 3082

var validQueries = [
  'song',
  'book'
]

app.post('/query', function(req, res){
  if(validQueries[req.body.type]){
    
  }

})

app.listen(port, function(){
  console.log('Listening on port: ' + port)
  var msg = {url: 'localhost:3082', id: 1},
      coordinator = 'localhost:3081/register'
  request.post({url: coordinator, body: msg, json: true}, function(err, response, body){
    if(err) throw new Error('Amazon module: could not register with ' + coordinator)
    else console.log('Amazon module: registered with ' + coordinator)
  })
})

var handleQuery = function(query, req, res){

}