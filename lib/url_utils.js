const path        = require('path')
const parse_url   = require('url').parse
const resolve_url = require('url').resolve

const validateRequestOptions = function(req_options){
  if (typeof req_options === 'string'){
    return true
  }
  else if (req_options instanceof Object){
    let val

    if (!req_options.protocol || !req_options.hostname || !req_options.pathname) return false

    val = req_options.protocol.toLowerCase()
    if ((val !== 'http:') && (val !== 'https:')) return false

    return true
  }
  else {
    return false
  }
}

const normalizeRequestOptionsCase = function(req_options){
  // normalize case-insensitive fields to lowercase
  if (req_options && (req_options instanceof Object)){
    const lc = (obj, key) => {
      if (!(obj instanceof Object)) return

      if (Array.isArray(key)){
        for (let i=0; i < key.length; i++)
          lc(obj, key[i])
      }
      else if (typeof key === 'string'){
        if (obj[key] && (typeof obj[key] === 'string'))
          obj[key] = obj[key].toLowerCase()
      }
    }

    lc(req_options, ['protocol', 'hostname', 'host'])

    if (req_options.headers && (req_options.headers instanceof Object)){
      const headers = {}
      const keys    = Object.keys(req_options.headers)
      let key, keyLC, val

      for (let i=0; i < keys.length; i++){
        key   = keys[i]
        keyLC = key.toLowerCase()
        val   = req_options.headers[key]

        headers[keyLC] = val
      }

      req_options.headers = headers
    }
  }
}

const normalizeRequestOptions = function(allow_partial_objects, req_options){
  let _req_options

  if (!req_options){
    _req_options = null
  }
  else if (Array.isArray(req_options)){
    _req_options = req_options
      .map(val => {
        if (typeof val !== 'string') return val

        try {
          val = parse_url(val)
          normalizeRequestOptionsCase(val)
          if (!validateRequestOptions(val)) throw ''
          return val
        }
        catch(e){
          return null
        }
      })
      .map(normalizeRequestOptions.bind(this, true))
      .filter(val => !!val)

    _req_options = (_req_options.length)
      ? Object.assign({}, ..._req_options)
      : null

    // regenerate aggregate URL parameter values
    if (!allow_partial_objects && _req_options){
      _req_options.host = !_req_options.hostname
        ? null
        : !_req_options.port
          ? _req_options.hostname
          : `${_req_options.hostname}:${_req_options.port}`

      _req_options.search = !_req_options.query
        ? null
        : `?${_req_options.query}`

      _req_options.path = !_req_options.pathname
        ? null
        : !_req_options.search
          ? _req_options.pathname
          : `${_req_options.pathname}${_req_options.search}`

      _req_options.href = (!_req_options.protocol || !_req_options.host || !_req_options.path)
        ? null
        : `${_req_options.protocol}//${_req_options.host}${_req_options.path}`
    }
  }
  else if (typeof req_options === 'string'){
    _req_options = req_options
  }
  else if (req_options instanceof Object){
    _req_options = (allow_partial_objects || (req_options.protocol && req_options.hostname && req_options.pathname))
      ? {...req_options}
      : null
  }
  else {
    _req_options = null
  }

  normalizeRequestOptionsCase(_req_options)

  return _req_options
}

const normalizePath = function(req_options){
  if ((typeof req_options !== 'object') || (req_options === null))
    return

  const raw_data = {
    path: req_options.pathname || req_options.path,
    href: req_options.href
  }

  if (!raw_data.path)
    return

  const normalized_path = path.posix.normalize(raw_data.path)

  if (normalized_path !== raw_data.path){
    req_options.pathname = normalized_path
    req_options.path     = normalized_path

    if (raw_data.href && (raw_data.href.indexOf(raw_data.path) >= 0))
      req_options.href = raw_data.href.replace(raw_data.path, normalized_path)
  }
}

const resolveRedirectLocation = function(redirect_url, original_url, redirects){
  const previous_url = (Array.isArray(redirects) && redirects.length)
    ? redirects[redirects.length - 1]
    : original_url

  return resolve_url(previous_url, redirect_url)
}

module.exports = {
  validateRequestOptions,
  normalizeRequestOptions: normalizeRequestOptions.bind(this, false),
  normalizePath,
  resolveRedirectLocation
}
