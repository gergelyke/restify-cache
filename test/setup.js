global.chai = require('chai');
global.should = chai.should();
global.expect = require('chai').expect();
global.redis = require("redis").createClient(6379, 'localhost');
global.cache = require('../lib');

global.PAYLOAD_PREFIX = 'payload_';
global.HEADER_PREFIX = 'header_';