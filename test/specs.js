describe('Redis-cache', function() {

  describe('saves', function() {


    afterEach(function (done) {
      redis.del(HEADER_PREFIX + '/beer', function (err) {
        if (err) {
          return done(err);
        }
        redis.del(PAYLOAD_PREFIX + '/beer', done);
      });
    });

    it.only('responseheaders', function(done) {
      cache.after({
        url: '/beer'
      }, {
        headers: function () {
          return {
            'Accept': 'application/xml'
          };
        }
      }, null, null, function (err) {
        if (err) {
          return done (err);
        }
        redis.get(HEADER_PREFIX + '/beer', function(err, data) {
          data.should.equal('{"Accept":"application/xml"}');
          done();
        });
      })
    });

    it('payload', function(done) {
      cache.after({
        url: '/beer'
      })
    });
  });

  describe('retrieves', function() {
    it('a response with headers', function() {

    });
  });

});