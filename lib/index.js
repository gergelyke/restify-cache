var redis = require("redis"),
  client,
  config;
/*
 * Sets the things
 * */
exports.config = function (cfg) {
  config = cfg || {};
  config.redisPort = config.redisPort || 6379;
  config.redisHost = config.redisHost || 'localhost';
  config.ttl = config.ttl || 60 * 60 * 1000; //1 hour
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
  client.get(url, function(err, response) {
    if (err) {
      return next(err);
    }
    if (response) {
      res.send(response);
    } else {
      next();
    }
  });

  next();
};

/*
* Put the response into Redis
* */
exports.after = function(req, res, route, error) {
  // if config wasn't called, lets set it now.
  if (!client) {
    exports.config();
  }
};