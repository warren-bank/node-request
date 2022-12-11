#!/usr/bin/env node

const {request} = require('../../request')
const {getCookieJar_MemoryCookieStore} = require('../../lib/cookie_jar')

const sep = Array(35).join('-')

const log = function(msg, {div=' ', pre='', post=''}={}){
  if (Array.isArray(msg)) msg = msg.join(div)
  msg = pre + (msg ? msg : '') + post
  process.stdout.write(msg)
}

/**
 * helper:
 *  - format a message with information about a successful network request
 *  - include the downloaded text data
 **/
const process_text_success = function(what, {url, redirects, response}){
  const headers = what.headers ?
`\n\nHTTP response headers of request:
${sep}
${JSON.stringify(response.headers, null, 2)}` : ''

  const body = what.body ?
`\n\nData response for URL of request:
${sep}
${response.trim()}` : ''

  log((
`${sep}${sep}
URL of request:
  ${url}${headers}${body}`
  ), {post:"\n\n"})
}

/**
 * helper:
 *  - format an error message
 **/
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

const run_test = async function(){
  const cookieJar = getCookieJar_MemoryCookieStore()

  // example: perform a request that adds a cookie "foo=bar"
  await request('https://httpbin.org/cookies/set/foo/bar', '', {cookieJar})
  .catch(process_error)

  // example: perform a request that retrieves cookies
  await request('https://httpbin.org/cookies', '', {cookieJar})
  .then(process_text_success.bind(this, {body: true}))
  .catch(process_error)
}

run_test()
