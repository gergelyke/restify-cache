Restify-cache
-------------
Based on the query string, it will store/retrieve JSON responses from Redis.
This is a Work In Progress, not ready for production (headers are not cached as of now).

[![Build Status](https://travis-ci.org/gergelyke/restify-cache.png?branch=feature/test)](https://travis-ci.org/gergelyke/restify-cache)
[![NPM](https://nodei.co/npm/restify-cache.png)](https://nodei.co/npm/restify-cache/)


### Usage ###

```
var cache = require('restify-cache');
cache.config({
    redisPort: 6379,            //Number (default: '6379')
    redisHost: 'localhost',     //String (default: 'localhost')
    redisOptions: {},           //Object (optional)
    redisAuth: 'password'       //String (optional)
    prefix: 'myname',           //String (optional, this will add a string prefix to the redis key)
    cacheHeader: 'x-api-key',   //String (optional, this will cache any request with this header key)
    cacheMethods: ['GET']       //Array  (optional, will only cache specified request methods; default ['GET']
    ttl: 60 * 60                //Number (optional, default:  60 * 60; in seconds)
});
```

The first middleware after auth (if there is any) should be the cache's before.

```
server.use(cache.before);
```

You have to subscribe for the server's after event as well.

__WARNING! In your route handlers, you always have to call `next()`!__

```
server.on('after', cache.after);
```

### Cache Control ###
Use of Restify's [res.cache()](http://mcavage.me/node-restify/#Response-API) method will control the [EXPIRE](http://redis.io/commands/expire) time in Redis.  The absence of a response cache will use the **cache.config.ttl** value identified above.

Indicates that the response should be cached for 600 seconds.
```
res.cache('public', 600);
```

A maxAge value of 0 will engage Redis, but set the expire seconds to 0 (essentially expiring immediately).
```
res.cache('public', 0);
```

### Additional Headers ###
A header is added to each response:

* __X-Cache: HIT__ - the response was served from cache
* __X-Cache: MISS__ - the response generation fell through to the endpoint
