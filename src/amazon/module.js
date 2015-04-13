var express = require('express'),
    request = require('request'),
    lodash = require('lodash'),
    uuid = require('node-uuid')

var app = express(),
    port = parseInt(process.argv[2]) || 3082,
    coordinator = 'localhost:3081/register'

var validQueries = {
  commerce: true,
  song: true,
  book: true
},
    openQueries = {},
    queryTree = {}

app.post('/query', function(req, res){
  var id = 0

  if(validQueries[req.body.query]){
    res.status(202).end()
    id = req.body.id
    openQueries[id] = lodash.copyDeep(req.body)
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
  console.log('Listening on port: ' + port)
  var msg = {url: 'localhost:3082', id: uuid.v1()}
  request.post({url: coordinator, body: msg, json: true}, function(err, response, body){
    if(err) throw new Error('Amazon module: could not register with ' + coordinator)
    else console.log('Amazon module: registered with ' + coordinator)
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

var queryAmazon = function(info){
  result = {}

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

  request.post({url: coordinator + '/query', body: query, json: true}, function(err, response, body){
    if(err){
      console.log('Amazon module: error punting query ' + query + ' to ' + coordinator)
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
  request.post({url: coordinator + '/response', body: query, json: true}, function(err, response, body){
    if(err) console.log('Amazon module: failure submitting query: ' + rootId + ' response to: ' + coordinator)
  })
  delete openQueries[rootId]
}
