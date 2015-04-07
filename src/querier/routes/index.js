var express = require('express');
var response = require('request');
var router = express.Router();

var coordinator = "http://localhost:8888";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/coordinator', function(req, res, next) {
    coordinator = req.body.url;
    res.redirect("/");
});

router.post('/query', function(req, res, next) {
    response.get(coordinator+"/query", {json:{sender: "http://localhost:3000", query:req.body.query}}, function(err,body,response){
        if(err){
          console.log(err);
        }
        res.send(response.statusCode);
    });        
});

module.exports = router;
