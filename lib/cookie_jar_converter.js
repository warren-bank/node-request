const TOUGH               = require('tough-cookie')
const {MemoryCookieStore} = require('tough-cookie/lib/memstore')
const fs                  = require('fs')

const canonicalDomain     = TOUGH.canonicalDomain

// -----------------------------------------------------------------------------

/*
 * "tough-cookie-file-store"
 *   - repo:
 *       https://github.com/ivanmarban/tough-cookie-file-store
 *   - summary:
 *     * this persists the cookie jar to the file system in JSON format
 *
 * "file-cookie-store"
 *   - repo:
 *       https://github.com/JSBizon/file-cookie-store
 *   - summary:
 *     * this persists the cookie jar to the file system in Netscape text format
 *
 * context:
 *   - request():
 *     * can accept a pre-constructed cookie jar that can be configured using any storage engine
 *     * can accept configs that instruct the construction of a new cookie jar using a limited selection of storage engine(s)
 *       - "tough-cookie-file-store" is the storage engine used to persist to the file system
 *
 * helper:
 *   - this helper library borrows the import/export code from "file-cookie-store"
 *       https://github.com/JSBizon/file-cookie-store/blob/61795ac4806504e1baaa3b459bcdaa1517ccad1f/index.js#L146
 *       https://github.com/JSBizon/file-cookie-store/blob/61795ac4806504e1baaa3b459bcdaa1517ccad1f/index.js#L188
 *   - it adds functions to convert between JSON and Netscape text file formats
 */

// -----------------------------------------------------------------------------
// convert JSON object to Netscape text

const serialize = function(idx) {
    var data = "# Netscape HTTP Cookie File\n" +
                "# http://www.netscape.com/newsref/std/cookie_spec.html\n" +
                "# This is a generated file!  Do not edit.\n\n";

    for (var domain in idx) {
        if ( ! idx.hasOwnProperty(domain) ) continue;
        for ( var path in idx[domain] ) {
            if ( ! idx[domain].hasOwnProperty(path) ) continue;
            for ( var key in idx[domain][path] ) {
                if ( ! idx[domain][path].hasOwnProperty(key) ) continue;
                var cookie = idx[domain][path][key];
                if (cookie) {

                    var cookie_domain = cookie.domain;
                    if ( ! cookie.hostOnly) {
                        cookie_domain = '.' + cookie_domain;
                    }
                    var line = [ this.http_only_extension && cookie.httpOnly ? '#HttpOnly_' + cookie_domain : cookie_domain, 
                             /^\./.test(cookie_domain) ? "TRUE" : "FALSE",
                             cookie.path,
                             cookie.secure ? "TRUE" : "FALSE", 
                             cookie.expires && cookie.expires != 'Infinity' ? (cookie.expires instanceof Date ? Math.round(cookie.expires.getTime() / 1000) : parseInt(cookie.expires, 10)) : 0,
                             encodeURIComponent(cookie.key),
                             encodeURIComponent(cookie.value),
                             ].join("\t")+ "\n";
                    data += line;

                }
            }
        }
    }
    return data;
}

// -----------------------------------------------------------------------------
// convert Netscape text to JSON object

const deserialize = function (raw_data) {
    var cookies = []

    var data_by_line = raw_data.split(/\r\n|\n/),
        line_num = 0,
        parsed,
        http_only = false,
        magic = data_by_line.length ? data_by_line[0] : '';

    if ( (! magic || ! /^\#(?: Netscape)? HTTP Cookie File/.test(magic) ))
        throw new Error(this.file + " does not look like a netscape cookies file");

    data_by_line.forEach(function (line) {
        ++line_num;
        if (! ( /^\s*$/.test(line) || (/^\s*\#/.test(line) &&
                ! /^#HttpOnly_/.test(line) ) ) ) {

            if (/^#HttpOnly_/.test(line)) {
                http_only = true;
                line = line.replace(/^#HttpOnly_(.*)/,"$1");
            } else {
                http_only = false;
            }

            parsed = line.split(/\t/);
            if (parsed.length != 7)
                throw new Error("Line " + line_num + " is not valid");

            var domain = parsed[0],
                can_domain = canonicalDomain(domain);

            var cookie = new TOUGH.Cookie({
                domain : can_domain,
                path : parsed[2],
                secure : parsed[3] == 'TRUE' ? true : false,
                //expires : parseInt(parsed[4]) ? new Date(parsed[4] * 1000) : undefined,
                expires : parseInt(parsed[4]) ? new Date(parsed[4] * 1000) : 'Infinity',
                key : decodeURIComponent(parsed[5]),
                value : decodeURIComponent(parsed[6]),
                httpOnly : http_only,
                hostOnly : /^\./.test(domain) ? false : true
            });

            cookies.push(cookie);
        }
    });
    return cookies;
}

// -----------------------------------------------------------------------------

const convert_JSON_to_NS = function(input_filepath_JSON, output_filepath_NS){
  let text_JSON = fs.readFileSync(input_filepath_JSON, 'utf8')
  let data      = JSON.parse(text_JSON)

  let text_NS   = serialize(data)
  fs.writeFileSync(output_filepath_NS, text_NS)
}

const convert_NS_to_JSON = function(input_filepath_NS, output_filepath_JSON){
  let text_NS   = fs.readFileSync(input_filepath_NS, 'utf8')
  let cookies   = deserialize(text_NS)

  let mcs       = new MemoryCookieStore()
  let noop      = () => {}
  for (const cookie of cookies) {
    mcs.putCookie(cookie, noop)
  }

  let data      = mcs.idx
  let text_JSON = JSON.stringify(data, null, 2)
  fs.writeFileSync(output_filepath_JSON, text_JSON)
}

// -----------------------------------------------------------------------------

module.exports = {
  convert_JSON_to_NS,
  convert_NS_to_JSON
}
