### [request](https://github.com/warren-bank/node-request)

An extremely lightweight HTTP request client. Supports: http, https, redirects, cookies, content-encoding, multipart/form-data. Returns: Promise.

The module includes 1 function:
  * `request`

It also exports 2 additional functions that are [included as dependencies](https://github.com/warren-bank/node-denodeify):
  * `denodeify`
  * `denodeify_net_request`

#### Installation:

```bash
npm install --save @warren-bank/node-request
```

- - - -

#### API:

__request(options[, POST_data, config])__

* `options` {string} | {Object} | {Array&lt;{string} | {Object}>}
  * {string} value
    * expected to contain a URL
  * {Object} value
    * for a complete list of all attributes,<br>
      please refer to the Node.js api documentation for:
      * [http.request](https://nodejs.org/api/http.html#http_http_request_options_callback)
      * [https.request](https://nodejs.org/api/https.html#https_https_request_options_callback)
  * {Array&lt;>} value
    * {string} URL values are parsed to {Object} values
    * combines its elements into a single {Object} value
* `POST_data` {string} | {Object} | {Buffer} | {stream.Readable} | {Array&lt;Object>}
  * {string} value
    * when _Content-Type_ header is undefined
      * _Content-Type_ header is given the value: _'application/x-www-form-urlencoded'_
  * {Object} value
    * is serialized to a {string} value based on the value of _Content-Type_ header
      * _'application/json'_:
        * converted to JSON
      * otherwise:
        * converted to querystring format
        * ex: `"a=1&b=2"`
    * when _Content-Type_ header is undefined
      * _Content-Type_ header is given the value: _'application/x-www-form-urlencoded'_
  * {Buffer} | {stream.Readable} values
    * when _Content-Type_ header is undefined
      * _Content-Type_ header is given the value: _'application/octet-stream'_
  * {Array&lt;Object>} value
    * _Content-Type_ header is given the value: _'multipart/form-data'_
    * {Object} value required attributes:
      1. `name`
         * type: {string}
      2. `value`
         * type: {string} | {number} | {Buffer} | {Object}
         * {string} | {number} | {Buffer} values
           * sent verbatim
         * {Object} value attributes:
           1. `file`
              * type: {stream.Readable}
           2. `filename`
              * type: {string}
              * when `file` is undefined:
                * required
                * value is an absolute filepath to a file that exists and is readable
              * when `file` is defined:
                * optional
                * value only needs a filename
           3. `mime` or `mime-type` or `content-type` or `headers.content-type`
              * type: {string}
              * prioritized as given, in descending order
              * highest priority value sets the _Content-Type_ header for the file
              * when no value is defined:
                * if `filename` is defined:
                  * file extension in `filename` is used to infer the _Content-Type_ header for the file
                * otherwise:
                  * _Content-Type_ header for the file is given the value: _'application/octet-stream'_
* `config` {Object}
  * `normalizePath` {Boolean} (defaults to `true`)
  * `followRedirect` {Boolean} (defaults to `true`)
  * `maxRedirects` {number} (defaults to `10`)
  * `binary` {Boolean} (defaults to `false`)
    * `false`:
      * data is returned in {String} (utf8 encoding)
    * `true`:
      * data is returned in {Buffer}
  * `stream` {Boolean} (defaults to `false`)
    * `false`:
      * `response` attribute of resolved Promise is a value that contains the entire data file (stored in memory)
      * data type of `response` is either {Buffer} or {String}, as determined by `binary` option
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
      * constructs an instance of `CookieJar` using the cookie store:<br>["tough-cookie-file-store"](https://github.com/ivanmarban/tough-cookie-file-store)
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
      * `config.binary` determines the data's encoding (ie: {Buffer} or utf8 {String})
      * `config.stream` determines whether the value is a Readable stream or a memory buffer,<br> either of which is formatted in the chosen encoding
      * the `response` Object always includes the following attributes:
        * `statusCode` {integer}
        * `headers` {Object}

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

- - - -

#### Convenience methods:

These HTTP method convenience functions act just like `request()` but with a default method:

- *request.get()*: Defaults to `method: "GET"`.
- *request.post()*: Defaults to `method: "POST"`.
- *request.put()*: Defaults to `method: "PUT"`.
- *request.patch()*: Defaults to `method: "PATCH"`.
- *request.delete() / request.del()*: Defaults to `method: "DELETE"`.
- *request.head()*: Defaults to `method: "HEAD"`.
- *request.options()*: Defaults to `method: "OPTIONS"`.

- - - -

#### Requirements:

* Node.js version: v8.6.0 (and higher)
  - transitive [dependency](https://github.com/warren-bank/node-request/blob/master/package.json#L9) requirements:
    * v8.06.00+: [`@warren-bank/node-denodeify`](https://github.com/warren-bank/node-denodeify#requirements)

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
