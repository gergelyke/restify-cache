Restify-cache
-------------
Based on the query string, it will store/retrieve the responses from Redis.

### Install ###

will be soon on NPM

### Usage ###

```
var cache = require('restify-cache');
cache.config({
    redisPort: 6379,        //default: '6379'
    redisHost: 'localhost', //default: 'localhost'
    redisOptions: {},       //optional
    ttl: 60 * 60 * 1000     //default:  60 * 60 * 1000
});
```

The first middleware after auth (if there is any) should be the cache's before.

```
server.use(cache.before);
```

You have to subscribe for the server's after event as well.
__!!!WARNING! In your route handlers, you always have to call `next()`!!!__

```
server.on('after', cache.after);
```