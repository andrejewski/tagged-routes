# Tagged Routes
> Routing using tagged unions

```sh
npm install tagged-routes
```

[![npm](https://img.shields.io/npm/v/tagged-routes.svg)](https://www.npmjs.com/package/tagged-routes)
[![Build Status](https://travis-ci.org/andrejewski/tagged-routes.svg?branch=master)](https://travis-ci.org/andrejewski/tagged-routes)
[![Greenkeeper badge](https://badges.greenkeeper.io/andrejewski/tagged-routes.svg)](https://greenkeeper.io/)

## Example

```js
import { createRoutes } from 'tagged-routes'

const { Route, getRouteForURL, getURLForRoute } = routeTable(
    {
        AppList: '/',
        AppMain: '/apps/:appId',
        AppSettings: '/apps/:appId/settings',
        Settings: '/settings/(.*)'
    },
    'NotFound'
)

console.log(getRouteForUrl('/apps/example?tab=hosting'))
/* => <AppMain ({
    routeParams: { appId: 'example' },
    queryParams: { tab: 'hosting' }
})> */

console.log(getRouteForUrl('/settings/can-be-anything'))
/* => <Settings ({
    routeParams: {},
    queryParams: {},
    routeSplat: 'can-be-anything'
})> */

console.log(getRouteForUrl('/bad/route-bad'))
/* => <NotFound ({
    routeParams: {},
    queryParams: {},
    routePath: '/bad/route-bad'
})> */

const exemplarRoute = Route.AppMain({
    routeParams: { appId: 'exemplar' },
    queryParams: { tab: 'billing' }
})

console.log(getURLForRoute(exemplarRoute))
// => /apps/exemplar?tab=billing
```

## Documentation

### `createRoutes(routeTable, catchAllRouteKind: string, options?: object)`
Accepts a `routeTable` object with route kinds (types of Route) as keys and valid [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp) paths as values along with a catch-all route kind `catchAllRouteKind`. The `options` are passed to `path-to-regexp` and `options.encode` is passed to `path-to-regexp.compile` URL builders to override the `encodeURIComponent` default.

Returns an object containing the below `Route` union and functions.

### `Route`
A [`tagmeme`](https://github.com/andrejewski/tagmeme) union, has a `.match` method and constructors for each route kind.

### `getRouteForURL(url: string): Route`
Returns the route that matches the `url`, or the catch-all route if none match. The shape of route data is:

```ts
interface RouteData {
    routeParams: {[key: string]: string}
    queryParams: {[key: string]: string}
    routeSplat?: string // only if route has a splat "(.*)" segment
    routePath?: string  // only if catch-all route
}
```

### `getURLForRoute(route: Route): string`
Returns the URL that matches the `route`.

Throws in development if:

- a route requiring certain `routeParams` values is missing values.
- the catch-all route does not have the `routePath` specified.