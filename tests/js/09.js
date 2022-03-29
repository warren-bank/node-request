#!/usr/bin/env node

const {request} = require('../../request')
const {normalizeRequestOptions} = require('../../lib/url_utils')

const sep = Array(35).join('-')

const log = function(msg, {div=' ', pre='', post=''}={}){
  if (Array.isArray(msg)) msg = msg.join(div)

  msg = pre + (msg ? msg : '') + post

  process.stdout.write(msg)
}

// -----------------------------------------------------------------------------
// test request option normalization

const process_request_options = function(original_req_options, normalized_req_options){
  log((
`${sep}${sep}
Original request options:
${sep}
${JSON.stringify(original_req_options, null, 2)}

Normalized request options:
${sep}
${JSON.stringify(normalized_req_options, null, 2)}
`
  ), {post:"\n"})
}

const test_request_options = function(original_req_options){
  const normalized_req_options = normalizeRequestOptions(original_req_options)
  process_request_options(original_req_options, normalized_req_options)
}

test_request_options()
test_request_options(null)
test_request_options('about:blank')
test_request_options('https://foo.com/bar/baz.html')

test_request_options([
  'about:blank'
])
test_request_options([
  'https://foo.com/bar/baz.html'
])
test_request_options([
  'https://foo.com:8080/bar/baz.html?hello=world'
])
test_request_options([
  'https://foo.com:8080/bar/baz.html?hello=world',
  {port: '9090', pathname: '/rab/zab.php', query: 'goodbye=world'}
])
test_request_options([
  'https://foo.com:8080/bar/baz.html?hello=world',
  {port: null, pathname: '/rab/zab.php', query: 'goodbye=world'},
  {headers: {'Content-Type': 'application/json'}}
])

// -----------------------------------------------------------------------------
// test bad URLs

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

const test_bad_url_input = function(){
  request(null)
  .catch(process_error)

  request('about:blank')
  .catch(process_error)
}

const test_bad_url_redirect = function(){
  let url

  // http://httpbin.org/#/Redirects/get_redirect_to
  // https://github.com/postmanlabs/httpbin/issues/617
  url = 'http://httpbin.org/redirect-to?url=about%3Ablank&status_code=301'

  // https://github.com/postmanlabs/httpbin/issues/617#issuecomment-747089912
  // mirrors:
  url = 'http://nghttp2.org/httpbin' + '/redirect-to?url=about%3Ablank&status_code=301'
  url = 'http://httpbingo.org'       + '/redirect-to?url=about%3Ablank&status_code=301'

  request(url)
  .catch(process_error)
}

test_bad_url_input()
test_bad_url_redirect()
