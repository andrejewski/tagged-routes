import test from 'ava'
import { createRoutes } from '../src'

test('createRoutes().Routes should have all kinds', t => {
  const { Route } = createRoutes(
    {
      AppList: '/'
    },
    'NotFound'
  )

  t.is(typeof Route.AppList, 'function', 'should have table kinds')
  t.is(typeof Route.NotFound, 'function', 'should have catch-all kind')
})

test('createRoutes().getRouteForURL should work for static routes', t => {
  const { Route, getRouteForURL } = createRoutes({ Foo: '/foo' }, 'NotFound')
  const route = getRouteForURL('/foo')
  Route.match(route, {
    Foo: () => t.pass(),
    NotFound: () => t.fail()
  })
})

test('createRoutes().getRouteForUrl should parse query params', t => {
  const { Route, getRouteForURL } = createRoutes({ Foo: '/foo' }, 'NotFound')
  const route = getRouteForURL('/foo?name=bar&value=baz')
  Route.match(
    route,
    {
      Foo ({ queryParams }) {
        t.deepEqual(queryParams, {
          name: 'bar',
          value: 'baz'
        })
      }
    },
    () => t.fail()
  )
})

test('createRoutes().getRouteForUrl should parse route params', t => {
  const { Route, getRouteForURL } = createRoutes(
    { Foo: '/foo/:name/:value' },
    'NotFound'
  )
  const route = getRouteForURL('/foo/bar/baz')
  Route.match(
    route,
    {
      Foo ({ routeParams }) {
        t.deepEqual(routeParams, {
          name: 'bar',
          value: 'baz'
        })
      }
    },
    () => t.fail()
  )
})

test('createRoutes().getRouteForUrl should parse route splats', t => {
  const { Route, getRouteForURL } = createRoutes(
    { Foo: '/foo/(.*)' },
    'NotFound'
  )
  const route = getRouteForURL('/foo/bar/baz')
  Route.match(
    route,
    {
      Foo ({ routeSplat }) {
        t.is(routeSplat, 'bar/baz')
      }
    },
    () => t.fail()
  )
})

test('createRoutes().getURLForRoute should return static paths', t => {
  const { Route, getURLForRoute } = createRoutes({ Foo: '/foo' }, 'NotFound')
  const route = Route.Foo({})
  t.is(getURLForRoute(route), '/foo')
})

test('createRoutes().getURLForRoute should include query string', t => {
  const { Route, getURLForRoute } = createRoutes({ Foo: '/foo' }, 'NotFound')
  const route = Route.Foo({ queryParams: { name: 'bar', value: 'baz' } })
  t.is(getURLForRoute(route), '/foo?name=bar&value=baz')
})

test('createRoutes().getURLForRoute should populate route params', t => {
  const { Route, getURLForRoute } = createRoutes(
    { Foo: '/foo/:name/:value' },
    'NotFound'
  )
  const route = Route.Foo({ routeParams: { name: 'bar', value: 'baz' } })
  t.is(getURLForRoute(route), '/foo/bar/baz')
})

test('createRoutes().getURLForRoute should populate route splat', t => {
  const { Route, getURLForRoute } = createRoutes(
    { Foo: '/foo/(.*)' },
    'NotFound'
  )
  const route = Route.Foo({ routeSplat: 'bar/baz' })
  t.is(getURLForRoute(route), '/foo/bar/baz')
})

test('createRoutes().getURLForRoute should return routePath if catch-all', t => {
  const { Route, getURLForRoute } = createRoutes({ Foo: '/foo' }, 'NotFound')
  const route = Route.NotFound({ routePath: '/bar/baz' })
  t.is(getURLForRoute(route), '/bar/baz')
})

test('createRoutes().getURLForRoute should return routePath if catch-all with querystring', t => {
  const { Route, getURLForRoute } = createRoutes({ Foo: '/foo' }, 'NotFound')
  const route = Route.NotFound({
    routePath: '/bar/baz',
    queryParams: { test: 'foo' }
  })
  t.is(getURLForRoute(route), '/bar/baz?test=foo')
})

test('createRoutes().getURLForRoute should throw if missing route params', t => {
  const { Route, getURLForRoute } = createRoutes(
    { Foo: '/foo/:name/:value' },
    'NotFound'
  )
  t.throws(() => {
    getURLForRoute(Route.Foo({ routeParams: { name: 'poop' } }))
  }, /params must include/)
})

test('createRoutes().getURLForRoute should throw if missing routePath for catch-all', t => {
  const { Route, getURLForRoute } = createRoutes(
    { Foo: '/foo/:name/:value' },
    'NotFound'
  )
  t.throws(() => {
    getURLForRoute(Route.NotFound({}))
  }, /route requires a/)
})

test('createRoutes().getURLForRoute should use the encode option if provided', t => {
  const { Route, getURLForRoute } = createRoutes(
    { Test: '/:foo/:bar/:baz' },
    'NotFound',
    {
      encode: (value, token) => token.name
    }
  )
  t.is(
    getURLForRoute(
      Route.Test({ routeParams: { foo: 'a', bar: 'b', baz: 'c' } })
    ),
    '/foo/bar/baz'
  )
})
