#!/usr/bin/env node

const fs   = require('fs')
const path = require('path')
const url  = require('url')

const {request} = require('../../request')

const sep = Array(35).join('-')

const log = function(msg, {div=' ', pre='', post=''}={}){
  if (Array.isArray(msg)) msg = msg.join(div)

  msg = pre + (msg ? msg : '') + post

  process.stdout.write(msg)
}

const process_success = function({url, redirects, response}){
  const headers = []

  for (const key in response.headers) {
    headers.push(`${key}: ${response.headers[key]}`)
  }

  log((
`${sep}${sep}
multipart/form-data:
${sep}
${headers.join("\n")}

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

// using:
//   https://github.com/warren-bank/node-serve/blob/130002.18.2/.etc/test/www/cgi-bin/echo-post-data/echo-post-data.pl

request.post(
  'http://localhost/cgi-bin/echo-post-data/echo-post-data.pl',
  [
    // multipart form data
    {
      name:  "hidden1",
      value: "Hello, World!"
    },
    {
      name:  "select1",
      value: "Foo"
    },
    {
      name:  "select1",
      value: "Bar"
    },
    {
      name:  "select1",
      value: "Baz"
    },
    {
      name:  "radio1",
      value: "Foo"
    },
    {
      name:  "checkbox1",
      value: "Foo"
    },
    {
      name:  "checkbox1",
      value: "Bar"
    },
    {
      name:  "checkbox1",
      value: "Baz"
    },
    {
      name:  "file1",
      value: {
        filename: path.resolve(__dirname, '../..', 'package.json')
      }
    },
    {
      name:  "files2",
      value: {
        filename: path.resolve(__dirname, '../..', '.gitignore')
      }
    },
    {
      name:  "files2",
      value: {
        file: fs.createReadStream( path.resolve(__dirname, '../..', '.gitignore') ),
        filename: 'gitignore.txt'
      }
    },
    {
      name:  "files2",
      value: {
        file: fs.createReadStream( path.resolve(__dirname, '../..', '.gitignore') ),
        mime: 'text/plain'
      }
    }
  ],
  {binary: false, stream: false}
)
.then(process_success)
.catch(process_error)
