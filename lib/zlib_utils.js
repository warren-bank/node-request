const {denodeify} = require('@warren-bank/node-denodeify')
const zlib = require('zlib')

const accept_encodings = {
  identity: true,
  compress: false,
  gzip:     ('function' === typeof zlib.createGunzip),
  deflate:  ('function' === typeof zlib.createInflate),
  br:       ('function' === typeof zlib.createBrotliDecompress)
}

const getRequestHeaderAcceptEncoding = function(){
  const header = []

  for (const encoding in accept_encodings){
    if (accept_encodings[encoding]){
      header.push(encoding)
    }
  }

  return header.join(', ')
}

const processResponseContentEncoding = async function(data, cb_options){
  try {
    if ((data instanceof Object) && (data.headers instanceof Object) && (typeof data.headers['content-encoding'] === 'string')){
      const encoding = data.headers['content-encoding'].toLowerCase()

      let decoder = null

      switch(encoding){
        case 'gzip':
          if (accept_encodings[encoding]){
            decoder = cb_options.stream
              ? zlib.createGunzip()
              : denodeify(zlib.gunzip)
          }
          break
        case 'deflate':
          if (accept_encodings[encoding]){
            decoder = cb_options.stream
              ? zlib.createInflate()
              : denodeify(zlib.inflate)
          }
          break
        case 'br':
          if (accept_encodings[encoding]){
            decoder = cb_options.stream
              ? zlib.createBrotliDecompress()
              : denodeify(zlib.brotliDecompress)
          }
          break
      }

      if (decoder){
        let decoded_data

        if (cb_options.stream){
          decoded_data = data.pipe(decoder) // Readable stream
        }
        else {
          decoded_data = await decoder(data) // Buffer

          if (!cb_options.binary){
            decoded_data = new String(decoded_data.toString('utf8')) // String
          }
        }

        decoded_data.headers = data.headers
        return decoded_data
      }
    }
  }
  catch(e){}

  return data
}

module.exports = {
  getRequestHeaderAcceptEncoding,
  processResponseContentEncoding
}
