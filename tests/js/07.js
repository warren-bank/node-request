#!/usr/bin/env node

const {request} = require('../../request')

const sep = Array(35).join('-')

const log = function(msg, {div=' ', pre='', post=''}={}){
  if (Array.isArray(msg)) msg = msg.join(div)

  msg = pre + (msg ? msg : '') + post

  process.stdout.write(msg)
}

const process_success = function({url, redirects, response}){
  try {
    const data   = JSON.parse(response.toString())
    const method = data.method
    if (!method) throw ''

    log(`request method: ${method}`, {post:"\n"})
  }
  catch(e) {
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

// verbs over HTTPS
request.get('https://httpbin.org/anything')
.then(process_success)
.catch(process_error)

request.post('https://httpbin.org/anything')
.then(process_success)
.catch(process_error)

request.put('https://httpbin.org/anything')
.then(process_success)
.catch(process_error)

// verbs over HTTP
request.patch('http://httpbin.org/anything')
.then(process_success)
.catch(process_error)

request.delete('http://httpbin.org/anything')
.then(process_success)
.catch(process_error)

request.del('http://httpbin.org/anything')
.then(process_success)
.catch(process_error)
