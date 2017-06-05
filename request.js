const {denodeify, denodeify_net_request} = require('@warren-bank/node-denodeify')
const parse_url = require('url').parse

const http = {
  request: denodeify_net_request( require('http').request )
}

const https = {
  request: denodeify_net_request( require('https').request )
}

const make_net_request = function(req_options, POST_data='', opts={}){
  const regex = /^https/i

  const is_url = (typeof req_options === 'string')
  const is_POST = (!! POST_data)

  const original_url = is_url ? req_options : `${req_options.protocol}//${req_options.host}:${req_options.port}${req_options.path}`

  var cb_options
  if ('validate_status_code' in opts){
    cb_options = {validate_status_code: opts.validate_status_code}
    delete opts.validate_status_code
  }
  else {
    cb_options = {}
  }

  const config = Object.assign(
    {},
    {
      // default user-configurable options
      followRedirect: true,
      maxRedirects: 10
    },
    opts
  )

  return new Promise((resolve, reject) => {
    var redirects = []
    var _is_https, _req_options, _protocol, _error

    const send_net_request = function(url){

      if (url === undefined){
        // initial request
        if (is_url){
          _is_https = regex.test(req_options)
          _req_options = req_options
        }
        else {
          _is_https = regex.test(req_options.protocol)
          _req_options = req_options
        }
      }
      else {
        // redirect
        _is_https = regex.test(url)

        if (is_url){
          _req_options = url
        }
        else {
          _req_options = Object.assign(
            {},
            req_options,
            parse_url(url)
          )
        }
      }

      if (typeof _req_options === 'string'){
        _req_options = parse_url(_req_options)
      }

      if (typeof _req_options['method'] !== 'string'){
        _req_options['method'] = (is_POST ? 'POST' : 'GET')
      }

      _protocol = _is_https ? https : http

      _protocol.request(_req_options, POST_data, cb_options)
      .then((data) => {
        resolve({url: original_url, redirects, response: data})
      })
      .catch((error) => {
        if ((error.statusCode) && (error.statusCode >= 300) && (error.statusCode < 400) && (error.location)){
          if (! config.followRedirect){
            _error = new Error('Not following redirects')
            _error.statusCode = error.statusCode
            _error.location = error.location
            _error.url = original_url
            reject(_error)
          }
          else if (config.maxRedirects === redirects.length){
            _error = new Error('Exceeded maximum number of redirects')
            _error.statusCode = error.statusCode
            _error.location = error.location
            _error.redirects = redirects
            _error.url = original_url
            reject(_error)
          }
          else {
            redirects.push(error.location)
            send_net_request(error.location)
          }
        }
        else {
          reject(error)
        }
      })

    }

    send_net_request()
  })
}

module.exports = {request: make_net_request, denodeify, denodeify_net_request}
