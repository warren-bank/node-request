const {denodeify, denodeify_net_request} = require('@warren-bank/node-denodeify')
const {getCookieJar, getCookieRequestHeader, setCookieResponseHeader} = require('./lib/cookie_jar')
const {getRequestHeaderAcceptEncoding, processResponseContentEncoding} = require('./lib/zlib_utils')
const {normalizeRequestOptions, normalizePath, resolveRedirectLocation} = require('./lib/url_utils')

const http = {
  request: denodeify_net_request( require('http').request )
}

const https = {
  request: denodeify_net_request( require('https').request )
}

const get_url_from_request_options = function(req_options){
  return `${req_options.protocol || 'http:'}//${req_options.host || 'localhost:80'}${req_options.path || '/'}`
}

const make_net_request = function(req_method, req_options, POST_data='', opts={}){
  req_options = normalizeRequestOptions(req_options)
  if (!req_options) return Promise.reject(new Error('missing required input parameter: request options / URL string'))

  const regex = /^https/i

  const is_url = (typeof req_options === 'string')
  const is_POST = (!! POST_data)
  let is_binary = false

  const original_url = is_url ? req_options : get_url_from_request_options(req_options)

  const cb_options = {binary: true}
  if ('validate_status_code' in opts){
    cb_options['validate_status_code'] = opts.validate_status_code
    delete opts.validate_status_code
  }
  if ('stream' in opts){
    cb_options['stream'] = opts.stream
    delete opts.stream
  }
  if ('binary' in opts){
    is_binary = opts.binary
    delete opts.binary
  }

  const config = Object.assign(
    {},
    {
      // default user-configurable options
      normalizePath: true,
      followRedirect: true,
      maxRedirects: 10,
      shuffleCiphers: false,
      randomizeCiphers: false,
      maxAdditionalCiphers: 5,
      cookieJar: null
    },
    opts
  )

  config.cookieJar = getCookieJar(config.cookieJar)

  return new Promise((resolve, reject) => {
    const redirects = []
    let _is_https, _req_options, _error

    const send_net_request = async function(url){

      if (url === undefined){
        // initial request
        if (is_url){
          _is_https = regex.test(req_options)
          _req_options = req_options
        }
        else {
          _is_https = regex.test(req_options.protocol)
          _req_options = {...req_options}
        }
      }
      else {
        // redirect
        _is_https = regex.test(url)

        if (is_url){
          _req_options = url
        }
        else {
          // parse URL string to Object, and validate format
          _req_options = normalizeRequestOptions([url])

          // if OK, combine with default attributes
          if (_req_options) {
            _req_options = normalizeRequestOptions([req_options, _req_options])
          }
        }
      }

      if (typeof _req_options === 'string'){
        // parse URL string to Object, and validate format
        _req_options = normalizeRequestOptions([_req_options])
      }

      if (!(_req_options && (_req_options instanceof Object))) {
        if (url === undefined){
          // bad URL
          _error = new Error('bad URL')
        }
        else {
          // bad 3xx redirect
          _error = new Error('bad URL: 3xx redirect')
          _error.location = url
        }
        _error.statusCode = 400
        _error.url = original_url
        reject(_error)
        return
      }

      if (typeof _req_options['method'] !== 'string'){
        _req_options['method'] = (req_method && (typeof req_method === 'string'))
          ? req_method
          : (is_POST ? 'POST' : 'GET')
      }

      if (!(_req_options['headers'] instanceof Object)){
        _req_options['headers'] = {}
      }
      if (typeof _req_options['headers']['accept-encoding'] !== 'string'){
        _req_options['headers']['accept-encoding'] = getRequestHeaderAcceptEncoding()
      }

      if (config.normalizePath){
        normalizePath(_req_options)
      }

      if (config.cookieJar){
        _req_options['headers'] = _req_options['headers'] || {}

        await getCookieRequestHeader(
          config.cookieJar,
          get_url_from_request_options(_req_options),
          _req_options['headers']
        )
      }

      if (config.shuffleCiphers && _is_https){
        const old_ciphers = (_req_options.ciphers || require('tls').DEFAULT_CIPHERS || '').split(':').map(val => val.toUpperCase())
        const new_ciphers = []

        while (old_ciphers.length){
          const index = Math.floor(Math.random() * old_ciphers.length)
          new_ciphers.push(
            ...old_ciphers.splice(index, 1)
          )
        }

        if (new_ciphers.length){
          _req_options.ciphers = new_ciphers.join(':')
        }
      }

      if (config.randomizeCiphers && _is_https){
        const old_ciphers = (_req_options.ciphers || require('tls').DEFAULT_CIPHERS || '').split(':').map(val => val.toUpperCase())
        let new_ciphers   = []

        // 1st pass: remove all blacklisted cipher groups
        {
          const old_ciphers_blacklist_indices = []
          for (let i=0; i < old_ciphers.length; i++) {
            const old_cipher = old_ciphers[i]
            if (old_cipher && ((old_cipher[0] === '!') || (old_cipher === 'HIGH'))) {
              old_ciphers_blacklist_indices.push(i)
            }
          }
          for (let i = (old_ciphers_blacklist_indices.length - 1); i >= 0; i--) {
            const old_index = old_ciphers_blacklist_indices[i]
            old_ciphers.splice(old_index, 1)
          }
        }

        // 2nd pass: add disabled ciphers
        {
          new_ciphers = [...old_ciphers]

          const all_ciphers = require('tls').getCiphers().map(val => val.toUpperCase())
          const alt_ciphers = all_ciphers.filter(val => !old_ciphers.includes(val))

          if (alt_ciphers.length) {
            const included = {}
            let remainder  = Math.min(alt_ciphers.length, config.maxAdditionalCiphers)

            while (remainder > 0) {
              // add a cipher to whitelist
              const alt_cipher_index = Math.floor(Math.random() * alt_ciphers.length)
              if (included[alt_cipher_index]) continue

              const new_cipher  = alt_ciphers[alt_cipher_index]
              new_ciphers.push(new_cipher)

              included[alt_cipher_index] = true
              remainder--
            }
          }
        }

        if (new_ciphers.length){
          _req_options.ciphers = new_ciphers.join(':')
        }
      }

      try {
        const protocol = _is_https ? https : http

        let data = await protocol.request(_req_options, POST_data, cb_options)

        if (config.cookieJar){
          await setCookieResponseHeader(
            config.cookieJar,
            get_url_from_request_options(_req_options),
            data.headers
          )
        }

        data = await processResponseContentEncoding(data, cb_options)

        if (!is_binary){
          if (cb_options.stream){
            data.setEncoding('utf8')
          }
          else {
            const txt_data = new String(data.toString('utf8'))
            txt_data.statusCode = data.statusCode
            txt_data.headers    = data.headers

            data = txt_data
          }
        }

        resolve({url: original_url, redirects, response: data})
      }
      catch(error) {
        if (config.cookieJar){
          await setCookieResponseHeader(
            config.cookieJar,
            get_url_from_request_options(_req_options),
            error.headers
          )
        }

        if ((error.statusCode) && (error.statusCode >= 300) && (error.statusCode < 400) && (error.location)){
          if (! config.followRedirect){
            _error = new Error('Not following redirects')
            _error.statusCode  = error.statusCode
            _error.location    = error.location
            _error.url         = original_url
            reject(_error)
          }
          else if (config.maxRedirects === redirects.length){
            _error = new Error('Exceeded maximum number of redirects')
            _error.statusCode  = error.statusCode
            _error.location    = error.location
            _error.redirects   = redirects
            _error.url         = original_url
            reject(_error)
          }
          else {
            const redirect = resolveRedirectLocation(error.location, original_url, redirects)

            redirects.push(redirect)
            send_net_request(redirect)
          }
        }
        else {
          reject(error)
        }
      }

    }

    send_net_request()
  })
}

const request   = make_net_request.bind(this, null)
request.get     = make_net_request.bind(this, 'GET')
request.post    = make_net_request.bind(this, 'POST')
request.put     = make_net_request.bind(this, 'PUT')
request.patch   = make_net_request.bind(this, 'PATCH')
request.delete  = make_net_request.bind(this, 'DELETE')
request.del     = make_net_request.bind(this, 'DELETE')
request.head    = make_net_request.bind(this, 'HEAD')
request.options = make_net_request.bind(this, 'OPTIONS')

module.exports = {request, denodeify, denodeify_net_request}
