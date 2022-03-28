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
  ${(redirects && redirects.length) ? redirects.join("\n  ") : '[]'}

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
  ${(error.redirects && error.redirects.length) ? error.redirects.join("\n  ") : '[]'}

Unfollowed redirect:
  ${error.location ? error.location : 'none'}`
  ), {post:"\n\n"})
}

// 1. download a Chuck Norris joke to a Readable stream
// 2. pipe this Readable stream to the POST data of a 2nd request
// 3. content of response echoes all data sent in 2nd request, which should contain a Chuck Norris joke
request.get('https://api.chucknorris.io/jokes/random', '', {binary: true, stream: true})
.then(data => request.post('https://httpbin.org/post', data.response))
.then(process_success)
.catch(process_error)
