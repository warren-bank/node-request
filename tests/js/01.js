#!/usr/bin/env node

const {request} = require('../../request')

const sep = Array(35).join('-')

const log = function(msg, {div=' ', pre='', post=''}={}){
  if (Array.isArray(msg)) msg = msg.join(div)

  msg = pre + (msg ? msg : '') + post

  process.stdout.write(msg)
}

const process_success = function({url, redirects, response}){
  log((
`${sep}${sep}
URL of initial request:
  ${url}

Chain of URL redirects:
  ${redirects.length ? redirects.join("\n  ") : '[]'}

Data in response for last URL:
${sep}
${response}`
  ), {post:"\n"})
}

const process_error = function(error){
  log((
`${sep}${sep}
Error:
  ${error.message}

HTTP status code:
  ${error.statusCode ? error.statusCode : 'unavailable'}

URL of initial request:
  ${error.url ? error.url : 'unavailable'}

Chain of URL redirects:
  ${error.redirects.length ? error.redirects.join("\n  ") : '[]'}

Unfollowed redirect:
  ${error.location ? error.location : 'none'}`
  ), {post:"\n\n"})
}

// example: perform a request that succeeds after performing 2 redirects and changing protocol from 'http' to 'https'
request('http://github.com/warren-bank/node-denodeify/raw/master/package.json')
.then(process_success)
.catch(process_error)

// example: perform the same request but configure the maximum number of permitted redirects to result in an Error
request('http://github.com/warren-bank/node-denodeify/raw/master/package.json', '', {maxRedirects: 1})
.then(process_success)
.catch(process_error)
