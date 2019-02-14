### [request](https://github.com/warren-bank/node-request)

An extremely lightweight HTTP request client.

The module includes 1 function:
  * `request`

It also exports 2 additional functions that are [included as dependencies](https://github.com/warren-bank/node-denodeify):
  * `denodeify`
  * `denodeify_net_request`

#### Installation:

```bash
npm install --save @warren-bank/node-request
```

#### API:

__request(options[, POST_data, config])__

* `options` {Object} | {string}
  * for a complete list of all attributes,<br>
    please refer to the Node.js api documentation for:
    * [http.request](https://nodejs.org/api/http.html#http_http_request_options_callback)
    * [https.request](https://nodejs.org/api/https.html#https_https_request_options_callback)
* `POST_data` {Object} | {string}
  * key/value pairs that are written to the Request object
  * {string} value takes the form: `"a=1&b=2"`
  * {Object} value takes the form: `{a:1,b:2}`
* `config` {Object}
  * `followRedirect` {Boolean} (defaults to `true`)
  * `maxRedirects` {number} (defaults to `10`)
  * `binary` {Boolean} (defaults to `false`)
    * `false`:
      * data is returned in {string} (utf8 encoding)
    * `true`:
      * data is returned in {Buffer}
  * `stream` {Boolean} (defaults to `false`)
    * `false`:
      * `response` attribute of resolved Promise is a value that contains the entire data file (stored in memory)
      * data type of `response` is either {Buffer} or {string}, as determined by `binary` option
    * `true`:
      * `response` attribute of resolved Promise is a Readable stream
  * `validate_status_code` {Function} | {false}
    * This `config` option is part of the API from `denodeify_net_request`.
    * It creates a Proxy that traps calls to `http.request` and `https.request`.<br>
      The Proxy accepts this value (to change its default behavior)<br>
      to determine what to do when a HTTP status code indicates something other than "200 OK".
    * The default value causes an Error object to propogate up the Promise chain.<br>
      This Error object includes some useful information.<br>
      In fact, the information produced by the default handler<br>
      is what enables `request` to follow redirects.<br>
      As such, please be careful if you choose to override this function.
  * `cookieJar` {CookieJar} | {string} | {true}
    * `CookieJar`:
      * instance of [require('tough-cookie').CookieJar](https://github.com/salesforce/tough-cookie)
        * choose your own cookie store
    * `string`:
      * file path to the persistent text file used to store cookie data
      * file is created when it does not already exist
      * constructs an instance of `CookieJar` using the cookie store:<br>["tough-cookie-filestore2"](https://github.com/stanleyxu2005/tough-cookie-filestore2)
        * this cookie store uses JSON format
    * `true`:
      * constructs an instance of `CookieJar` using the cookie store:<br>[require('tough-cookie/lib/memstore').MemoryCookieStore](https://github.com/salesforce/tough-cookie/blob/master/lib/memstore.js)
        * this cookie store is initialized empty and the cookies it collects are not persisted
        * this is only useful when:
          * the request is redirected at least once
          * cookies are added earlier in the chain of redirects than they are ultimately consumed
    * default:
      * no cookie jar is used
* Returns: {Promise}
  * value is resolved to an {Object}: `{url, redirects, response}`
    * `url` is a {string} that represents the original request `options`
    * `redirects` is an {Array} of {string}
      * each value is a url in the chain of redirects
      * the ordering is chronological;<br>
        the first element was the first redirect (from `url`)
    * `response` is the data payload
      * `config.binary` determines the data's encoding (ie: {Buffer} or utf8 {string})
      * `config.stream` determines whether the value is a Readable stream or a memory buffer,<br> either of which is formatted in the chosen encoding

#### Example:

```javascript
const {request, denodeify} = require('@warren-bank/node-request')

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

Data response for URL of final request:
${sep}
${response}`
  ), {post:"\n"})
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
  ${(redirects && redirects.length) ? redirects.join("\n  ") : '[]'}`
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
  ${(redirects && redirects.length) ? redirects.join("\n  ") : '[]'}`
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
.then((data) => {process_binary_success(data, 'denodeify.Buffer.zip')})
.catch(process_error)

// example: perform the same request but retrieve the binary data from a Readable stream
request('https://github.com/warren-bank/node-denodeify/archive/master.zip', '', {binary: true, stream: true})
.then((data) => {process_binary_stream_success(data, 'denodeify.Stream.zip')})
.catch(process_error)
```

#### Requirements:

* Node version: v6.4.0 (and higher)
  * [ES6 support](http://node.green/)
    * v0.12.18+: Promise
    * v4.08.03+: Object shorthand methods
    * v5.12.00+: spread operator
    * v6.04.00+: Proxy constructor
    * v6.04.00+: Proxy 'apply' handler
    * v6.04.00+: Reflect.apply
  * tested in:
    * v7.9.0

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
