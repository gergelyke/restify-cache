Restify-cache
-------------
Based on the query string, it will store/retrieve JSON responses from Redis.
This is a Work In Progress, not ready for production (headers are not cached as of now).

[![NPM](https://nodei.co/npm/restify-cache.png)](https://nodei.co/npm/restify-cache/)


### Usage ###

```
var cache = require('restify-cache');
cache.config({
    redisPort: 6379,        //default: '6379'
    redisHost: 'localhost', //default: 'localhost'
    redisOptions: {},       //optional
    ttl: 60 * 60            //default:  60 * 60; in seconds
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