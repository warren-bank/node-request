const {CookieJar}         = require('tough-cookie')
const {MemoryCookieStore} = require('tough-cookie/lib/memstore')
const {FileCookieStore}   = require('tough-cookie-file-store')
const {denodeify}         = require('@warren-bank/node-denodeify')
const path                = require('path')

const getCookieJar_MemoryCookieStore = function(){
  return new CookieJar()
}

const getCookieJar_FileCookieStore = function(filepath){
  filepath = path.resolve(filepath)

  const fileCookieStore   = new FileCookieStore(filepath)
  return new CookieJar(fileCookieStore)
}

const getCookieJar = function(config){
  if (config instanceof CookieJar){
    return config
  }
  if (config === true){
    return getCookieJar_MemoryCookieStore()
  }
  if (typeof config === 'string'){
    return getCookieJar_FileCookieStore(config)
  }
  return null
}

// return value: Promise
const getCookieRequestHeader = function(jar, url, reqHeaders){
  const  jar_getCookieString = denodeify(jar.getCookieString, jar)

  return jar_getCookieString(url)
  .then((cookie) => {
    if (reqHeaders instanceof Object){
      if (reqHeaders.cookie) {
        reqHeaders.cookie = reqHeaders.cookie + '; ' + cookie
      }
      else {
        reqHeaders.cookie = cookie
      }
    }

    return cookie
  })
}

// return value: Promise
const setCookieResponseHeader = async function(jar, url, resHeaders){
  if ((resHeaders instanceof Object) && Array.isArray(resHeaders['set-cookie'])) {
    const jar_setCookie = denodeify(jar.setCookie, jar)

    for (const cookie of resHeaders['set-cookie']){
      await jar_setCookie(cookie, url)
    }
  }
}

module.exports = {
  CookieJar,
  MemoryCookieStore,
  FileCookieStore,
  getCookieJar_MemoryCookieStore,
  getCookieJar_FileCookieStore,
  getCookieJar,
  getCookieRequestHeader,
  setCookieResponseHeader
}
