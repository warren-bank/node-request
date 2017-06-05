#!/usr/bin/env node

const {request, denodeify} = require('../../request')

const fs = {
  writeFile: denodeify( require('fs').writeFile )
}

const sep = Array(35).join('-')

const log = function(msg, {div=' ', pre='', post=''}={}){
  if (Array.isArray(msg)) msg = msg.join(div)
  msg = pre + (msg ? msg : '') + post
  process.stdout.write(msg)
}

const process_text_success = function({url, redirects, response}){
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

const process_binary_success = function({url, redirects, response}, filename){
  log((
`${sep}${sep}
URL of initial request:
  ${url}

Chain of URL redirects:
  ${redirects.length ? redirects.join("\n  ") : '[]'}`
  ), {post:"\n\n"})

  fs.writeFile(filename, response, 'binary')
  .then(() => {
    log(['Binary data file saved to:', filename], {div:"\n  ", post:"\n\n"})
  })
  .catch((error) => {
    log(['Error: Failed to save binary data file to:', filename], {div:"\n  ", post:"\n\n"})
    log(['Error message:', error.message], {div:"\n  ", post:"\n\n"})
  })

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
.then(process_text_success)
.catch(process_error)

// example: perform the same request but configure the maximum number of permitted redirects to result in an Error
request('http://github.com/warren-bank/node-denodeify/raw/master/package.json', '', {maxRedirects: 1})
.then(process_text_success)
.catch(process_error)

// example: perform a request that succeeds after performing 1 redirect and retrieves binary data in a Buffer
request('https://github.com/warren-bank/node-denodeify/archive/master.zip', '', {binary: true})
.then((data) => {process_binary_success(data, 'denodeify.zip')})
.catch(process_error)
