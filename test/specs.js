describe('Redis-cache', function () {

  var testUrl = '/testing-the-redis-cache';

  describe('saves', function () {


    afterEach(function (done) {
      redis.del(HEADER_PREFIX + testUrl, function (err) {
        if (err) {
          return done(err);
        }
        redis.del(PAYLOAD_PREFIX + testUrl, function (err) {
          done(err);
        });
      });
    });

    it('responseheaders', function (done) {
      cache.after({
        url: testUrl
      }, {
        headers: function () {
          return {
            'Accept': 'application/xml'
          };
        }
      }, null, null, function (err) {
        if (err) {
          return done(err);
        }
        redis.get(HEADER_PREFIX + testUrl, function (err, data) {
          if (err) {
            return done(err);
          }
          if (!data) {
            return done('No data!')
          }
          data.should.equal('{"Accept":"application/xml"}');
          done();
        });
      })
    });

    it('payload', function (done) {
      cache.after({
        url: testUrl
      }, {
        headers: function () {
          return {};
        },
        _data: JSON.stringify({
          'testing': 1,
          'expect': 'works'
        })
      }, null, null, function (err) {
        if (err) {
          return done(err);
        }
        redis.get(PAYLOAD_PREFIX + testUrl, function (err, data) {
          if (err) {
            return done(err);
          }
          if (!data) {
            return done('No data!')
          }
          data.should.equal('{\"testing\":1,\"expect\":\"works\"}');
          done();
        });
      });
    });
  });

  describe('retrieves', function () {
    it('a response with headers', function () {

    });
  });

});