var express = require('express'),
    request = require('request'),
    lodash = require('lodash'),
    uuid = require('node-uuid'),
    bodyParser = require('body-parser'),
    logger = require("morgan")

var amazon = require('./amazon')

var app = express(),
    port = parseInt(process.argv[2]) || 3082,
    coordinatorUrl = 'http://localhost:3081',
    moduleUrl = 'localhost:' + port

var validQueries = {
  commerce: true,
  song: true,
  book: true
},
    openQueries = {},
    queryTree = {},
    registered = false

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.post('/query', function(req, res){
  var id = 0

  if(validQueries[req.body.query]){
    res.status(202).end()
    id = req.body.id
    openQueries[id] = lodash.cloneDeep(req.body)
    handleQuery(openQueries[id], id)
  }else{
    res.status(400).end()
  }
})

app.post('/response', function(req, res){
  res.status(202).end()

  var query = req.body,
      rootId = queryTree[query.id]

  delete queryTree[query.id]

  if(query.status >= 300){
    finalizeQuery(query.status, rootId)
  }else{
    handleQuery(query, rootId)
  }
})

app.listen(port, function(){
  console.log('Amazon module listening on port: ' + port)
  var msg = {url: moduleUrl}
  request.post({url: coordinatorUrl + '/register', body: msg, json: true}, function(err, response, body){
    if(err){
      console.log('Amazon module: could not register with ' + coordinatorUrl + ' Error: %j', err)
    }else{
      console.log('Amazon module: registered with ' + coordinatorUrl)
      registered = true
    }
  })
})

var handleQuery = function(query, rootId){
  var data = query.data,
      id = 0,
      info = {}
  if(data[0].query){
    if(validQueries[data[0].query]){
      handleQuery(data[0], rootId)
    }else{
      id = uuid.v1()
      data[0].id = id
      queryTree[id] = rootId
      openQueries[id] = data[0]
      puntQuery(openQueries[id])
    }
  }else{
    info = queryAmazon(data[0])
    data[0] = lodash.merge(data[0], info)
    finalizeQuery(200, rootId)
  }
}

/*
This code would actually query amazon for item attributes. However, their terms of use didn't let
us use the API for this purpose so we had to hardcode a solution in the meantime.
var queryAmazon = function(info, callback){
  amazon.execute('ItemSearch', {
    SearchIndex: info.category,
    Keywords: info.track_name,
    ResponseGroup: 'ItemAttributes'
  }, function(err, results){
    if(err){
      console.log(err)
    }else{
      callback(results)
    }
  })
}
*/

var queryAmazon = function(info){
  var result = {}

  switch(info.category){
    case 'song':
      result.price = 1.29
      break
    default:
      break
  }

  return result
}

var puntQuery = function(query){
  var rootId = 0

  request.post({
      url: coordinatorUrl + '/query',
      body: lodash.merge(query, {sender: moduleUrl}),
      json: true},
      function(err, response, body){
    if(err){
      console.log('Amazon module: error punting query ' + query + ' to ' + coordinatorUrl)
    }

    if(response.status >= 300){
      rootId = queryTree[query.id]
      delete queryTree[query.id]
      finalizeQuery(response.status, rootId)
    }
  })
}

var finalizeQuery = function(status, rootId){
  var query = openQueries[rootId]
  query.status = status
  console.log(query)
  if(!registered) return
  request.post({url: coordinatorUrl + '/response', body: query, json: true}, function(err, response, body){
    if(err) console.log('Amazon module: failure submitting query: ' + rootId + ' response to: ' + coordinatorUrl)
  })
  delete openQueries[rootId]
}
