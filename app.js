var util = require('util')
var path = require('path')
var fs = require('fs')

var express = require('express')
var logger = require('morgan')
var bodyParser = require('body-parser')
var favicon = require('serve-favicon')
var moment = require('moment')
var Pageres = require('pageres')

var app = express()

var port = 3008
var dist = path.join(__dirname, 'crop')
var filename = '<%= url %>-<%= date %>-<%= size %>'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(favicon(__dirname + '/favicon.ico'));
app.use(logger('short'))


app.get('/', function(req, res, next) {
  var query = req.query
  var uri   = query.uri
  var size  = query.size ||'320x480'
  var delay = query.delay||1
  var file

  res.setHeader('Cache-Control', 'public, max-age=360')

  if(!uri) return res.status(400).sendFile(path.join(__dirname, 'uri-required.png'))

  uri = uri.replace(/^(https?:\/\/)?(w{3}.)?/gi, '')
  file = path.resolve(__dirname, 'crop', uri.replace(/\/|\?/g,'!')+'-'+moment().format('YYYY-MM-DD')+'-'+size+'.png')
  console.log(file)

  fs.exists(file, function(exists) {
    if(exists) return res.sendFile(file)


    util.log('pageres handel.')
    var pageres = new Pageres({
        delay: delay,
        filename: filename
      })
      .src(uri, [size], {crop: true})
      .dest(dist)

    pageres.run(function (err, result) {
      if(err) return next(err)

      res.sendFile(path.join(__dirname, 'crop', result[0].filename))
    })
  })
})


/* 404 */
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})


/* Error Handle */
app.use(function(err, req, res, next) {
  var status = err.status || 500
  util.error(err)
  return res.sendFile(path.join(__dirname, status+'.png'))
})

var app = app.listen(port, function() {
  util.log('Express server listening on port ' + app.address().port);
});