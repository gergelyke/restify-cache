var redis = require("redis"),
  _ = require('lodash'),
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
  config.auth = config.auth || null;
  config.ttl = config.ttl || 60 * 60; //1 hour
  config.cacheMethods = (config.cacheMethods) ? _.map(config.cacheMethods, function(s){return s.toUpperCase()}) : ['GET']; // default to only caching GET requests
  config.cacheHeader = config.cacheHeader || false; // caching on an arbitrary header

  client = redis.createClient(config.redisPort, config.redisHost, config.redisOptions);

  // attach additional prefix if needed
  PAYLOAD_PREFIX += config.prefix + '_' || '';
  HEADER_PREFIX += config.prefix + '_' || '';

  // check if redis auth was provided
  if(config.auth){
    client.auth(config.auth)
  }

  return client;
};

/*
 * Checks if we have the response in Redis
 * */
exports.before = function (req, res, next) {
  var url,
    _PAYLOAD_PREFIX = PAYLOAD_PREFIX,
    _HEADER_PREFIX = HEADER_PREFIX;

  // if config wasn't called, lets set it now.
  if (!client) {
    exports.config();
  }

  // check if we are caching this request method
  if(!_.contains(config.cacheMethods, req.method)){
    return next();
  }

  if(config.cacheHeader && _.contains(_.keys(req.headers), config.cacheHeader)){
    _PAYLOAD_PREFIX = _PAYLOAD_PREFIX + req.headers[config.cacheHeader];
    _HEADER_PREFIX = _HEADER_PREFIX + req.headers[config.cacheHeader];
  }

  url = req.url;
  client.get(_PAYLOAD_PREFIX + url, function(err, payload) {
    if (err) {
      return next(err);
    }
    client.get(_HEADER_PREFIX + url, function(err, headers) {
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
  var _PAYLOAD_PREFIX = PAYLOAD_PREFIX,
    _HEADER_PREFIX = HEADER_PREFIX;

  if(config.cacheHeader && _.contains(_.keys(req.headers), config.cacheHeader)){
    _PAYLOAD_PREFIX = _PAYLOAD_PREFIX + req.headers[config.cacheHeader];
    _HEADER_PREFIX = _HEADER_PREFIX + req.headers[config.cacheHeader];
  }

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

  client.set(_HEADER_PREFIX + req.url, JSON.stringify(res.headers()), function(err){
    client.expire(_HEADER_PREFIX + req.url, determineCacheTTL(res));

    // save the payload
    client.set(_PAYLOAD_PREFIX + req.url, res._data, function(err){
      client.expire(_PAYLOAD_PREFIX + req.url, determineCacheTTL(res), cb);
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