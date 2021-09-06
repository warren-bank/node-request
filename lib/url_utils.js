const path = require('path')

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
  normalizePath
}
