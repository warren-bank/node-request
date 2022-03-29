const path = require('path')
const parse_url = require('url').parse

const normalizeRequestOptions = function(allow_partial_objects, req_options){
  let _req_options

  if (!req_options){
    _req_options = null
  }
  else if (Array.isArray(req_options)){
    _req_options = req_options
      .map(val => {
        try {
          return (typeof val === 'string') ? parse_url(val) : val
        }
        catch(e) {
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

      _req_options.path = !_req_options.pathname
        ? null
        : !_req_options.search
          ? _req_options.pathname
          : `${_req_options.pathname}${_req_options.search}`

      _req_options.href = (!req_options.protocol || !req_options.host || !req_options.path)
        ? null
        : `${_req_options.protocol}://${_req_options.host}${req_options.path}`
    }
  }
  else if (typeof req_options === 'string'){
    _req_options = req_options
  }
  else if (req_options instanceof Object){
    _req_options = (allow_partial_objects || (req_options.protocol && req_options.hostname && req_options.pathname))
      ? req_options
      : null
  }
  else {
    _req_options = null
  }

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

  if (normalized_path !== raw_data.path) {
    req_options.pathname = normalized_path
    req_options.path     = normalized_path

    if (raw_data.href && (raw_data.href.indexOf(raw_data.path) >= 0))
      req_options.href = raw_data.href.replace(raw_data.path, normalized_path)
  }
}

module.exports = {
  normalizeRequestOptions: normalizeRequestOptions.bind(this, false),
  normalizePath
}
