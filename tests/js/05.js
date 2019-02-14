#!/usr/bin/env node

const {request}   = require('../../request')
const parse_url   = require('url').parse
const querystring = require('querystring')

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
const process_text_request_metadata_success = function({url, redirects, response}){
  var all_data, select_data
  all_data = JSON.parse(response)
  select_data = {
    "url": all_data.url,
    "method": all_data.method,
    "querystring": all_data.args,
    "data": all_data.data || querystring.stringify(all_data.form),
    "headers": {
      "Content-Length": all_data.headers['Content-Length']
    }
  }
  log([`${sep}${sep}`, JSON.stringify(select_data)], {div:"\n", post:"\n\n"})
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
  const req_options = parse_url('https://httpbin.org/anything')

  // example: perform a GET and write data to the querystring
  await request(Object.assign({}, req_options, {method: 'GET', path: `${req_options.path}?my-method=GET&my-data=querystring`}))
  .then(process_text_request_metadata_success)
  .catch(process_error)

  // example: perform a GET and write data to the outbound Request stream
  await request(Object.assign({}, req_options, {method: 'GET', path: '/get'}), 'my-method=GET&my-data=stream')
  .then(process_text_request_metadata_success)
  .catch(process_error)

  // example: perform a POST and write data to the outbound Request stream
  await request(Object.assign({}, req_options, {method: 'POST', path: '/post'}), 'my-method=POST&my-data=stream')
  .then(process_text_request_metadata_success)
  .catch(process_error)

  // example: perform a PUT and write data to the outbound Request stream
  await request(Object.assign({}, req_options, {method: 'PUT', path: '/put'}), 'my-method=PUT&my-data=stream')
  .then(process_text_request_metadata_success)
  .catch(process_error)

  // example: perform a PATCH and write data to the outbound Request stream
  await request(Object.assign({}, req_options, {method: 'PATCH', path: '/patch'}), 'my-method=PATCH&my-data=stream')
  .then(process_text_request_metadata_success)
  .catch(process_error)

  // example: perform a DELETE and write data to the outbound Request stream
  await request(Object.assign({}, req_options, {method: 'DELETE', path: '/delete'}), 'my-method=DELETE&my-data=stream')
  .then(process_text_request_metadata_success)
  .catch(process_error)
}

run_test()
