#!/usr/bin/env node

const {request} = require('../../request')

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
const process_success = function(context, json){
  var all_data, select_data
  all_data = JSON.parse(json)
  select_data = {}

  for (const key of ['gzipped', 'deflated', 'brotli']) {
    if (all_data[key] !== undefined) {
      select_data[key] = all_data[key]
    }
  }

  if (all_data.headers) {
    select_data.headers = {}

    for (const key of ['Host', 'Accept-Encoding']) {
      if (all_data.headers[key] !== undefined) {
        select_data.headers[key] = all_data.headers[key]
      }
    }
  }

  log(JSON.stringify({context, response: select_data}, null, 4), {post:"\n"})
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

const streamToString = function(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data',  (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end',   () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

const run_test = async function(){
  const encodings     = ['gzip', 'deflate', 'brotli']
  const stream_states = [false, true]
  const binary_states = [false, true]

  for (const encoding of encodings) {
    for (const stream of stream_states) {
      for (const binary of binary_states) {
        log(`${sep}${sep}`, {post:"\n"})

        const url        = `https://httpbin.org/${encoding}`
        const print_json = process_success.bind(null, {url, encoding, stream, binary})

        if (!stream && !binary) {
          await request(url, null, {stream, binary})
          .then(data => '' + data.response).then(print_json)
          .catch(process_error)
        }
        if (!stream && binary) {
          await request(url, null, {stream, binary})
          .then(data => data.response).then(buf => buf.toString('utf8')).then(print_json)
          .catch(process_error)
        }
        if (stream) {
          await request(url, null, {stream, binary})
          .then(data => data.response).then(streamToString).then(print_json)
          .catch(process_error)
        }
      }
    }
  }
}

run_test()
