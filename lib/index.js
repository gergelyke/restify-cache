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
          res.setHeader(headerItem, parsedHeaders[headerItem]);
        }

        res.writeHead(200);
        res.end(payload);
      } else {
        next();
      }
    });
  });
};

/*
* Put the response into Redis
* */
exports.after = function(req, res, route, error, cb) {
  // if config wasn't called, lets set it now.
  if (!client) {
    exports.config();
  }
  // save the headers

  client.set(HEADER_PREFIX + req.url, JSON.stringify(res.headers()), function(err ){
    client.expire(HEADER_PREFIX + req.url, config.ttl);

    // save the payload
    client.set(PAYLOAD_PREFIX + req.url, res._data, function(err ){
      client.expire(PAYLOAD_PREFIX + req.url, config.ttl, cb);
    });

  });



};