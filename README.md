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
* Returns: {Promise}

#### Example:

```javascript
const {request} = require('@warren-bank/node-request')

const sep = Array(35).join('-')

const log = function(msg, {div=' ', pre='', post=''}={}){
  if (Array.isArray(msg)) msg = msg.join(div)

  msg = pre + (msg ? msg : '') + post

  process.stdout.write(msg)
}

const process_success = function({url, redirects, response}){
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
.then(process_success)
.catch(process_error)

// example: perform the same request but configure the maximum number of permitted redirects to result in an Error
request('http://github.com/warren-bank/node-denodeify/raw/master/package.json', '', {maxRedirects: 1})
.then(process_success)
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
