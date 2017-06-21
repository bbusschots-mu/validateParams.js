var validateParams = require('../');

QUnit.test('function exists', function(a){
  a.equal(typeof validateParams, 'function');
});