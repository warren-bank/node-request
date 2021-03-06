#!/usr/bin/env node

const {request, denodeify} = require('../../request')

const fs = {
  writeFile: denodeify( require('fs').writeFile ),

  createWriteStream: require('fs').createWriteStream
}

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
const process_text_success = function({url, redirects, response}){
  log((
`${sep}${sep}
URL of initial request:
  ${url}

Chain of URL redirects:
  ${(redirects && redirects.length) ? redirects.join("\n  ") : '[]'}

HTTP response headers of final request:
${sep}
${JSON.stringify(response.headers, null, 2)}

Data response for URL of final request:
${sep}
${response.trim()}`
  ), {post:"\n\n"})
}

/**
 * helper:
 *  - format a message with information about a successful network request
 *  - save the binary data Buffer to disk
 **/
const process_binary_success = function({url, redirects, response}, filename){
  log((
`${sep}${sep}
URL of initial request:
  ${url}

Chain of URL redirects:
  ${(redirects && redirects.length) ? redirects.join("\n  ") : '[]'}

HTTP response headers of final request:
${sep}
${JSON.stringify(response.headers, null, 2)}`
  ), {post:"\n\n"})

  fs.writeFile(filename, response, 'binary')
  .then(() => {
    log(['Binary data Buffer saved to file:', filename], {div:"\n  ", post:"\n\n"})
  })
  .catch((error) => {
    log(['Error: Failed to save binary data Buffer to file:', filename], {div:"\n  ", post:"\n\n"})
    log(['Error message:', error.message], {div:"\n  ", post:"\n\n"})
  })
}

/**
 * helper:
 *  - format a message with information about a successful network request
 *  - save the binary data stream to disk
 **/
const process_binary_stream_success = function({url, redirects, response}, filename){
  log((
`${sep}${sep}
URL of initial request:
  ${url}

Chain of URL redirects:
  ${(redirects && redirects.length) ? redirects.join("\n  ") : '[]'}

HTTP response headers of final request:
${sep}
${JSON.stringify(response.headers, null, 2)}`
  ), {post:"\n\n"})

  response
    .pipe( fs.createWriteStream(filename) )
    .on('finish', () => {
      log(['Binary data Stream saved to file:', filename], {div:"\n  ", post:"\n\n"})
    })
    .on('error', (error) => {
      log(['Error: Failed to save binary data Stream to file:', filename], {div:"\n  ", post:"\n\n"})
      log(['Error message:', error.message], {div:"\n  ", post:"\n\n"})
      response.destroy()
    })
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
  // example: perform a request that succeeds after performing 2 redirects and changing protocol from 'http' to 'https'
  await request('http://github.com/warren-bank/node-denodeify/raw/master/package.json')
  .then(process_text_success)
  .catch(process_error)

  // example: perform the same request but configure the maximum number of permitted redirects to result in an Error
  await request('http://github.com/warren-bank/node-denodeify/raw/master/package.json', '', {maxRedirects: 1})
  .then(process_text_success)
  .catch(process_error)

  // example: perform a request that succeeds after performing 1 redirect and retrieves binary data in a Buffer
  await request('https://github.com/warren-bank/node-denodeify/archive/master.zip', '', {binary: true})
  .then((data) => {process_binary_success(data, 'denodeify.Buffer.zip')})
  .catch(process_error)

  // example: perform the same request but retrieve the binary data from a Readable stream
  await request('https://github.com/warren-bank/node-denodeify/archive/master.zip', '', {binary: true, stream: true})
  .then((data) => {process_binary_stream_success(data, 'denodeify.Stream.zip')})
  .catch(process_error)
}

run_test()
