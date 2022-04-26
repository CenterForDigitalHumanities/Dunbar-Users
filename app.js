#!/usr/bin/env node
var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var dotenv = require('dotenv')
var dotenvExpand = require('dotenv-expand')
var storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)
var logger = require('morgan')
const cors = require('cors')
const got = require('got')

const indexRouter = require('./routes/index.js')
const managementRouter = require('./routes/manage.js')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

//Middleware to use

/**
 * Get the various CORS headers right
 * "methods" : Allow 
 * "allowedMethods" : Access-Control-Allow-Methods  (Allow ALL the methods)
 * "allowedHeaders" : Access-Control-Allow-Headers  (Allow custom headers)
 * "exposedHeaders" : Access-Control-Expose-Headers (Expose the custom headers)
 * "origin" : "*"   : Access-Control-Allow-Origin   (Allow ALL the origins)
 * "maxAge" : "600" : Access-Control-Max-Age        (how long to cache preflight requests, 10 mins)
 */ 
app.use(
  cors({
    "methods" : "GET,OPTIONS,HEAD,PUT,PATCH,DELETE,POST",
    "allowedHeaders" : [
      'Content-Type',
      'Content-Length',
      'Allow',
      'Authorization',
      'Location',
      'ETag',
      'Connection',
      'Keep-Alive',
      'Date',
      'Cache-Control',
      'Last-Modified',
      'Link',
      'X-HTTP-Method-Override'
    ],
    "exposedHeaders" : "*",
    "origin" : "*",
    "maxAge" : "600"
  })
)
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//Publicly available scripts, CSS, and HTML pages.
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)

app.use('/dunbar-users/manage', managementRouter)

//catch 404 because of an invalid site path
app.use(function(req, res, next) {
    let msg = res.statusMessage ?? "This page does not exist"
    res.status(404).send(msg)  
    res.end()
})

module.exports = app
