describe('Redis-cache', function() {

    var testUrl = '/testing-the-redis-cache';

    describe("errors do not write cache", function() {
        it("do not throw if callback is not provided", function(done) {
            var ex = new Error('expected');

            var fn = function() {
                cache.after({
                    url: testUrl
                }, null, null, ex)
            };

            chai.expect(fn).to.not.throw();

            done();
        });

        it("do not write cache in after", function(done) {
            var ex = new Error('expected');
            cache.after({
                url: testUrl
            }, null, null, ex, function(err) {

                ex.should.be.equal(err);

                redis.get(HEADER_PREFIX + testUrl, function(err, data) {
                    if (err) {
                        return done(err);
                    }

                    (data === null).should.equal(true);

                    return done();
                });
            });
        });
    });

    describe('saves', function() {

        afterEach(function(done) {
            redis.del(HEADER_PREFIX + testUrl, function(err) {
                if (err) {
                    return done(err);
                }
                redis.del(PAYLOAD_PREFIX + testUrl, function(err) {
                    done(err);
                });
            });
        });

        describe("cache-control not specified", function() {
            it('responseheaders', function(done) {
                cache.after({
                    url: testUrl
                }, {
                    headers: function() {
                        return {
                            'Accept': 'application/xml'
                        };
                    },
                    method: function(){
                        return 'GET'
                    },
                    header: function(key, value) {
                        key.should.equal('X-Cache');
                        value.should.equal('MISS');
                    },
                    getHeader: function() {
                        return undefined;
                    }
                }, null, null, function(err) {
                    if (err) {
                        return done(err);
                    }
                    redis.get(HEADER_PREFIX + testUrl, function(err, data) {
                        if (err) {
                            return done(err);
                        }
                        if (!data) {
                            return done('No data!')
                        }
                        data.should.equal('{"Accept":"application/xml"}');

                        redis.ttl(HEADER_PREFIX + testUrl, function(err, data) {
                            if (err) {
                                return done(err);
                            }
                            if (!data) {
                                return done('No data!')
                            }
                            data.should.equal(3600);

                            done();
                        });
                    });
                })
            });

            it('payload', function(done) {
                cache.after({
                    url: testUrl
                }, {
                    headers: function() {
                        return {};
                    },
                    method: function(){
                        return 'GET'
                    },
                    header: function(key, value) {
                        key.should.equal('X-Cache');
                        value.should.equal('MISS');
                    },
                    getHeader: function() {
                        return undefined;
                    },
                    _data: JSON.stringify({
                        'testing': 1,
                        'expect': 'works'
                    })
                }, null, null, function(err) {
                    if (err) {
                        return done(err);
                    }
                    redis.get(PAYLOAD_PREFIX + testUrl, function(err, data) {
                        if (err) {
                            return done(err);
                        }
                        if (!data) {
                            return done('No data!')
                        }
                        data.should.equal('{\"testing\":1,\"expect\":\"works\"}');

                        redis.ttl(PAYLOAD_PREFIX + testUrl, function(err, data) {
                            if (err) {
                                return done(err);
                            }
                            if (!data) {
                                return done('No data!')
                            }
                            data.should.equal(3600);
                            done();
                        });
                    });
                });
            });
        });

        describe("cache-control specified", function() {
            it('responseheaders', function(done) {
                cache.after({
                    url: testUrl
                }, {
                    headers: function() {
                        return {
                            'Accept': 'application/xml',
                            'Cache-Control': 'public, max-age=54321'
                        };
                    },
                    method: function(){
                        return 'GET'
                    },
                    header: function(key, value) {
                        key.should.equal('X-Cache');
                        value.should.equal('MISS');
                    },
                    getHeader: function() {
                        return 'public, max-age=54321';
                    }
                }, null, null, function(err) {
                    if (err) {
                        return done(err);
                    }
                    redis.get(HEADER_PREFIX + testUrl, function(err, data) {
                        if (err) {
                            return done(err);
                        }
                        if (!data) {
                            return done('No data!')
                        }
                        data.should.equal('{"Accept":"application/xml","Cache-Control":"public, max-age=54321"}');

                        redis.ttl(HEADER_PREFIX + testUrl, function(err, data) {
                            if (err) {
                                return done(err);
                            }
                            if (!data) {
                                return done('No data!')
                            }
                            data.should.equal(54321);
                        });
                        done();
                    });
                })
            });

            it('payload', function(done) {
                cache.after({
                    url: testUrl
                }, {
                    headers: function() {
                        return {};
                    },
                    method: function(){
                        return 'GET'
                    },
                    header: function(key, value) {
                        key.should.equal('X-Cache');
                        value.should.equal('MISS');
                    },
                    getHeader: function() {
                        return 'public, max-age=1';
                    },
                    _data: JSON.stringify({
                        'testing': 1,
                        'expect': 'works'
                    })
                }, null, null, function(err) {
                    if (err) {
                        return done(err);
                    }
                    redis.get(PAYLOAD_PREFIX + testUrl, function(err, data) {
                        if (err) {
                            return done(err);
                        }
                        if (!data) {
                            return done('No data!')
                        }
                        data.should.equal('{\"testing\":1,\"expect\":\"works\"}');

                        redis.ttl(PAYLOAD_PREFIX + testUrl, function(err, data) {
                            if (err) {
                                return done(err);
                            }
                            if (!data) {
                                return done('No data!')
                            }
                            data.should.equal(1);
                        });

                        done();
                    });
                });
            });
        });
    });
    describe('retrieves', function() {

        beforeEach(function(done) {
            cache.after({
                url: testUrl
            }, {
                headers: function() {
                    return {
                        'Accept': 'application/xml'
                    };
                },
                method: function(){
                    return 'GET'
                },
                header: function() {},
                getHeader: function() {
                    return undefined;
                },
                _data: JSON.stringify({
                    'testing': 1,
                    'expect': 'works'
                })
            }, null, null, done);
        });

        afterEach(function(done) {
            redis.del(HEADER_PREFIX + testUrl, function(err) {
                if (err) {
                    return done(err);
                }
                redis.del(PAYLOAD_PREFIX + testUrl, function(err) {
                    done(err);
                });
            });
        });

        it('a response', function(done) {
            var headers = {};
            cache.before({
                url: testUrl
            }, {
                header: function(key, value) {
                    headers[key] = value;
                },
                method: function(){
                    return 'GET'
                },
                end: function(data) {
                    data.should.equal('{\"testing\":1,\"expect\":\"works\"}');

                    headers['X-Cache'].should.equal('HIT');
                    headers['Accept'].should.equal('application/xml');
                    done();
                },
                writeHead: function() {}
            }, function() {

            });
        });
    });
});