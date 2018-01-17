const { union } = require('tagmeme')
const {
  parse: parseQueryString,
  stringify: stringifyQueryParams
} = require('querystring')
const pathToRegexp = require('path-to-regexp')
const invariant = require('invariant')

function createRoutes (table, catchAllKind) {
  const kinds = Object.keys(table)
  const Route = union(kinds.concat(catchAllKind))

  const kindKeysMap = {}
  const compiledPathCreators = {}
  const routeUrlMap = {}
  const matchers = kinds.map(kind => {
    const url = table[kind]
    const keys = []
    const test = pathToRegexp(url, keys)

    kindKeysMap[kind] = keys
    compiledPathCreators[kind] = pathToRegexp.compile(url)
    routeUrlMap[kind] = data => {
      const routeParams = data.routeParams
      const routeSplat = data.routeSplat
      const queryParams = data.queryParams
      const params = routeSplat
        ? Object.assign({}, routeParams, { 0: routeSplat })
        : routeParams
      if (process.env.NODE_ENV !== 'production') {
        const keys = kindKeysMap[kind]
        keys.forEach(key => {
          invariant(
            key.optional || key.name in params,
            `Route params must include "${key.name}"`
          )
        })
      }
      const path = compiledPathCreators[kind](
        params,
        routeSplat
          ? {
            encode: x =>
              (x === routeSplat ? routeSplat : encodeURIComponent(x))
          }
          : undefined
      )
      const query = stringifyQueryParams(queryParams)
      return query.length ? `${path}?${query}` : path
    }

    return {
      test,
      keys,
      type: Route[kind]
    }
  })

  routeUrlMap[catchAllKind] = data => {
    const routePath = data.routePath
    const queryParams = data.queryParams
    if (process.env.NODE_ENV !== 'production') {
      invariant(
        typeof routePath === 'string' && routePath,
        'Catch-all route requires a `routePath` string'
      )
    }
    const query = stringifyQueryParams(queryParams)
    return query.length ? `${routePath}?${query}` : routePath
  }

  return {
    Route,
    getRouteForURL (url) {
      const parts = url.split('?')
      const path = parts[0]
      const query = parts[1] || ''
      const queryParams = parseQueryString(query)
      for (let i = 0; i < matchers.length; i++) {
        const matcher = matchers[i]
        const match = matcher.test.exec(path)
        if (match) {
          const keys = matcher.keys
          const type = matcher.type
          let routeSplat
          const routeParams = {}
          keys.forEach((key, index) => {
            const value = match[index + 1]
            if (key.pattern === '.*') {
              routeSplat = value
            }

            routeParams[key.name] = value
          })
          return type({ routeParams, routeSplat, queryParams })
        }
      }

      return Route[catchAllKind]({
        routeParams: {},
        routePath: path,
        queryParams
      })
    },
    getURLForRoute (route) {
      return Route.match(route, routeUrlMap)
    }
  }
}

exports.createRoutes = createRoutes
