var redis = require("redis"),
  client,
  config;

var PAYLOAD_PREFIX = 'payload_',
  HEADER_PREFIX = 'header_';
/*
 * Sets the things
 * */
exports.config = function (cfg) {
  config = cfg || {};
  config.redisPort = config.redisPort || 6379;
  config.redisHost = config.redisHost || 'localhost';
  config.ttl = config.ttl || 60 * 60; //1 hour
  client = redis.createClient(config.redisPort, config.redisHost, config.redisOptions);
};

/*
 * Checks if we have the response in Redis
 * */
exports.before = function (req, res, next) {
  var url;
  // if config wasn't called, lets set it now.
  if (!client) {
    exports.config();
  }
  url = req.url;
  client.get(PAYLOAD_PREFIX + url, function(err, payload) {
    if (err) {
      return next(err);
    }
    client.get(HEADER_PREFIX + url, function(err, headers) {
      var parsedHeaders,
        headerItem;

      if (err) {
        return next(err);
      }
      if (payload && headers) {
        parsedHeaders = JSON.parse(headers);
        for (headerItem in parsedHeaders) {
          res.header(headerItem, parsedHeaders[headerItem]);
        }

        res.header('X-Cache', 'HIT');
        res.writeHead(200);
        res.end(payload);
      } else {
        res.header('X-Cache', 'MISS');
        next();
      }
    });
  });
};

/*
* Put the response into Redis
* */
exports.after = function(req, res, route, error, cb) {
    if (error) {
        if (cb) {
            return cb(error);
        }

        return;
    }

  // if config wasn't called, lets set it now.
  if (!client) {
    exports.config();
  }
  // save the headers

  client.set(HEADER_PREFIX + req.url, JSON.stringify(res.headers()), function(err ){
    client.expire(HEADER_PREFIX + req.url, determineCacheTTL(res));

    // save the payload
    client.set(PAYLOAD_PREFIX + req.url, res._data, function(err ){
      client.expire(PAYLOAD_PREFIX + req.url, determineCacheTTL(res), cb);
    });

  });



};

function determineCacheTTL(res) {
    var cacheControl = res.getHeader('cache-control');

    if (cacheControl) {
        var maxAgeMatch = /max-age=(\d+)/.exec(cacheControl);

        if (maxAgeMatch) {
            return maxAgeMatch[1];
        }
    }

    return config.ttl;
}