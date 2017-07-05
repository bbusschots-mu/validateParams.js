//
// === Setup and other Prep Work ===============================================
//

// import the module under test
var validateParams = require('../');

// import validate.js
var validate = require('validate.js');

// import shellJS
var shell = require('shelljs');

// A library of dummy data and related functions to speed up data validation

/**
 * A collection of named dummy data definitions, each a plain object indexed
 * by `val` (the dummy data), and `desc` (an English description).
 *
 * This data is re-set before every test.
 */
var DUMMY_DATA = {};

/**
 * A sub-set of `DUMMY_DATA` covering only the basic types.
 *
 * This data is re-set before every test.
 */
var DUMMY_BASIC_TYPES = {};

// Add the event handler to re-set the dummy data before each test.
QUnit.testStart(function() {
    DUMMY_DATA = {
        undef: {
            desc: 'undefined',
            val: undefined
        },
        'null': {
            desc: 'undefined',
            val: null
        },
        nan: {
            desc: 'NaN (not a number)',
            val: NaN
        },
        bool: {
            desc: 'a boolean',
            val: true
        },
        num: {
            desc: 'a number',
            val: 42,
        },
        str_empty: {
            desc: 'an empty string',
            val: ''
        },
        str: {
            desc: 'a generic string',
            val: 'boogers!'
        },
        arr_empty: {
            desc: 'an emptyy array',
            val: [],
        },
        arr: {
            desc: 'an array',
            val: [1, 2, 3],
        },
        obj_empty: {
            desc: 'an empty plain object',
            val: {},
        },
        obj: {
            desc: 'a plain object',
            val: {b: 'boogers'}
        },
        obj_proto: {
            desc: 'a prototyped object',
            val: new Error('dummy error object')
        },
        fn: {
            desc: 'a function object',
            val: function(a,b){ return a + b; }
        }
    };
    DUMMY_BASIC_TYPES = {
        undef: DUMMY_DATA.undef, 
        bool: DUMMY_DATA.bool,
        num: DUMMY_DATA.num,
        str: DUMMY_DATA.str,
        arr: DUMMY_DATA.arr,
        obj: DUMMY_DATA.obj,
        fn: DUMMY_DATA.fn
    };
});

/**
 * A function to return the names of all dummy basic types except those passed
 * as arguments.
 *
 * @param {...string} typeName The name of a basic type in `DUMMY_BASIC_TYPES`
 */
function dummyBasicTypesExcept(){
    // build and exclusion lookup from the arguments
    var exclude_lookup = {};
    for(var i = 0; i < arguments.length; i++){
        exclude_lookup[arguments[i]] = true;
    }
    
    // build the list of type names not excluded
    var ans = [];
    Object.keys(DUMMY_BASIC_TYPES).sort().forEach(function(tn){
        if(!exclude_lookup[tn]){
            ans.push(tn); // save the type name if not excluded
        }
    });
    
    // return the calculated list
    return ans;
}

//
// === The Tests ===============================================================
//

QUnit.module('project management', {}, function(){
    QUnit.test('version numbers', function(a){
        a.expect(3);
        
        // RE for valid versions
        var versionRE = new RegExp(/\d+([.]\d+){2}/);
        
        // read the version from package.json
        var packageString = shell.cat('package.json');
        var packageData = JSON.parse(packageString);
        var packageVersion = packageData.version;
        
        // read the version from the JSDoc comment
        var jsDocVersion = '';
        var jsDocLine = shell.grep('@version', 'validateParams.js');
        var jsDocRE = new RegExp('[@]version[ ]+(' + versionRE.source + ')');
        var jsDocResult = jsDocRE.exec(jsDocLine);
        if(jsDocResult && jsDocResult[1]){
            jsDocVersion = jsDocResult[1];
        }
        
        // make sure both versions are valid
        a.ok(versionRE.exec(packageVersion), 'version number in package.json is valid');
        a.ok(versionRE.exec(jsDocVersion), 'version number in JSDoc comment is valid');
        a.equal(packageVersion, jsDocVersion, 'both versions are the same');
    });
});

QUnit.module('validateParams.apply() function',
    {
        beforeEach: function(){
            this.dummyFn = function(){
                var result = validateParams.apply(arguments, [
                    {
                        presence: true,
                    },
                    {
                        presence: true,
                        numericality: true
                    },
                    {
                        numericality: true
                    }
                ]);
                if(result.errors()){
                    throw new Error();
                }
            };
        }
    },
    function(){
        QUnit.test('function exists', function(a){
            a.equal(typeof validateParams.apply, 'function');
        });
        
        QUnit.test('parameter number validation', function(a){
            a.expect(4);
            a.throws(
                function(){ validateParams.apply(); },
                Error,
                'first argument required'
            );
            a.throws(
                function(){ validateParams.apply([]); },
                Error,
                'second argument required'
            );
            a.ok((function(){ validateParams.apply([], []); return true; })(), 'third argument is not required');
            a.ok((function(){ validateParams.apply([], [], {}); return true; })(), 'third argument is allowed');
        });
        
        QUnit.test('parameter list validation', function(a){
            var mustThrow = dummyBasicTypesExcept('arr');
            a.expect(mustThrow.length + 2);
            
            // make sure all the basic types excep array do indeed throw
            mustThrow.forEach(function(tn){
                a.throws(
                    function(){ validateParams.apply(DUMMY_BASIC_TYPES[tn].val, []); },
                    Error,
                    'parameter list not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
                );
            });
            
            // make sure an array does not throw
            a.ok((function(){ validateParams.apply([], []); return true; })(), 'parameter list can be an array');
            
            // make sure an Arguments object does not throw
            a.ok((function(){ validateParams.apply(arguments, []); return true; })(), 'parameter list can be an Arguments object');
        });
        
        QUnit.test('constraint list validation', function(a){
            var mustThrow = dummyBasicTypesExcept('arr');
            a.expect(mustThrow.length + 1);
            
            // make sure all the basic types excep array do indeed throw
            mustThrow.forEach(function(tn){
                a.throws(
                    function(){ validateParams.apply([], DUMMY_BASIC_TYPES[tn].val); },
                    Error,
                    'constraint list not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
                );
            });
            
            // make sure an array does not throw
            a.ok((function(){ validateParams.apply([], []); return true; })(), 'constraint list can be an array');
        });
        
        QUnit.test('options validation', function(a){
            var mustThrow = dummyBasicTypesExcept('obj', 'undef');
            a.expect(mustThrow.length + 1);
            
            // make sure all the basic types excep array do indeed throw
            mustThrow.forEach(function(tn){
                a.throws(
                    function(){ validateParams.apply([], [], DUMMY_BASIC_TYPES[tn].val); },
                    Error,
                    'options not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
                );
            });
            
            // make sure an object does not throw
            a.ok((function(){ validateParams.apply([], [], {}); return true; })(), 'options can be an object');
        });
        
        QUnit.test('basic validation', function(a){
            var fn = this.dummyFn;
            
            a.expect(6);
            a.throws(
                function(){
                    fn();
                },
                Error,
                'error when two required arguments are missing'
            );
            a.throws(
                function(){
                    fn('stuff');
                },
                Error,
                'error when one required arguments are missing'
            );
            a.throws(
                function(){
                    fn('stuff', 'thingys');
                },
                Error,
                'error when all required arguments are present, but on is invalid'
            );
            a.throws(
                function(){
                    fn('stuff', 2, 'whatsists');
                },
                Error,
                'error when called valid values for all required params but an invalid value for an optional param'
            );
            a.ok((function(){ fn('stuff', 2); return true; })(), 'no error when all required params are present and valid');
            a.ok((function(){ fn('stuff', 2, 4); return true; })(), 'no error when all required params are present and valid, and an optional param is present and valid');
        });
        
        QUnit.test('fatal mode', function(a){
            a.expect(5);
            
            // create a dummy function that validates params with options.fatal=true
            var fatalFn = function(){
                validateParams.apply(arguments,
                    [
                        {
                           presence: true,
                           numericality: true
                        },
                        {
                            presence: true,
                            numericality: true
                        }
                    ],
                    { fatal: true, format: 'flat' }
                );
            };
            
            // test that the function throws or not as appropraite
            a.throws(function(){ fatalFn('boogers'); }, validateParams.ValidationError, 'fatal mode throws as expected');
            a.ok((function(){ fatalFn(2, 3); return true; })(), 'fatal mode does not throw on valid params');
            
            // test that the thrown error has the expected properties
            var errorObj;
            try{
                fatalFn('boogers'); // trigger an error
            }catch(err){
                errorObj = err; // store the thrown error
            }
            a.ok(errorObj instanceof validateParams.ValidationError, 'thrown error has expected prototype');
            a.ok(validate.isArray(errorObj.validationErrors), 'thrown error contains an array of validation errors');
            a.equal(errorObj.validationErrors.length, 2, 'thrown error contains the expected number of validation errors');
        });
    }
);

QUnit.module('validateParams.coerce() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.coerce, 'function');
    });
    
    QUnit.test('parameter number validation', function(a){
        a.expect(4);
        a.throws(
            function(){ validateParams.coerce(); },
            Error,
            'first argument required'
        );
        a.throws(
            function(){ validateParams.coerce([]); },
            Error,
            'second argument required'
        );
        a.ok((function(){ validateParams.coerce([], []); return true; })(), 'third argument is not required');
        a.ok((function(){ validateParams.coerce([], [], {}); return true; })(), 'third argument is allowed');
    });
    
    QUnit.test('params validation', function(a){
        var mustThrow = dummyBasicTypesExcept('arr');
        a.expect(mustThrow.length + 2);
            
        // make sure all the basic types excep array do indeed throw
        mustThrow.forEach(function(tn){
            a.throws(
                function(){ validateParams.coerce(DUMMY_BASIC_TYPES[tn].val, []); },
                Error,
                'params not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
            );
        });
            
        // make sure an array does not throw
        a.ok((function(){ validateParams.coerce([], []); return true; })(), 'params can be an array');
            
        // make sure an Arguments object does not throw
        a.ok((function(){ validateParams.coerce(arguments, []); return true; })(), 'params can be an Arguments object');
    });
    
    QUnit.test('coercion on arguments object', function(a){
        // create a function that applies a coercion
        var testFn = function(v){
            validateParams.coerce(arguments, [
                {
                    vpopt_coerce: function(){
                        return 4;
                    }
                }
            ]);
            return v;
        };
        
        // check the coercion is applied
        a.equal(testFn(5), 4);
    });
    
    QUnit.test('coercion on Array', function(a){
        var a1 = [5];
        validateParams.coerce(a1, [
            {
                vpopt_coerce: function(){
                    return 4;
                }
            }
        ]);
        a.equal(a1[0], 4);
    });
    
    QUnit.test('returns reference to parameter list', function(a){
        var params = [1, 2];
        var out = validateParams.coerce(params, []);
        a.strictEqual(out, params);
    });
});

QUnit.module('validateParams.assert() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.assert, 'function');
    });
    
    QUnit.test('function behaves as expected', function(a){
        a.expect(2);
        
        // create a dummy function that validates params with validateParams.assert()
        var fatalFn = function(){
            validateParams.assert(arguments,
                [
                    {
                       presence: true,
                       numericality: true
                    },
                    {
                        presence: true,
                        numericality: true
                    }
                ]
            );
        };
        
        // test that the function throws or not as appropraite
        a.throws(function(){ fatalFn('boogers'); }, validateParams.ValidationError, 'throws as expected');
        a.ok((function(){ fatalFn(2, 3); return true; })(), 'does not throw on valid params');
    });
});

QUnit.module('validateParams.ValidationError prototype', {}, function(){
    QUnit.test('prototype exists', function(a){
        a.equal(typeof validateParams.ValidationError, 'function');
    });
    
    QUnit.test('constructor correctly builds object', function(a){
        a.expect(5);
        var dummyMessage = 'test error message';
        var dummyErrors = ['some error', 'some other error'];
        var testError = new validateParams.ValidationError(dummyMessage, dummyErrors);
        a.ok(testError instanceof validateParams.ValidationError, 'is instance of validateParams.ValidationError');
        a.ok(testError instanceof Error, 'is instance of Error');
        a.equal(testError.name, 'validateParams.ValidationError', 'has expected .name property');
        a.equal(testError.message, dummyMessage, 'has expected .message property');
        a.deepEqual(testError.validationErrors, dummyErrors, 'has expected .validationErrors property');
    });
});

QUnit.module('validateParams.Result prototype', {}, function(){
    QUnit.test('prototype exists', function(a){
        a.equal(typeof validateParams.Result, 'function');
    });
    
    QUnit.test('constructor successfully builds empty object', function(a){
        a.expect(6);
        var r = new validateParams.Result();
        a.ok(r instanceof validateParams.Result, 'is instance of validateParams.Result');
        a.ok(validate.isArray(r._parameterList), 'parameter list is an array');
        a.ok(validate.isArray(r._constraintList), 'constraint list is an array');
        a.ok(validate.isObject(r._options), 'options is an object');
        a.ok(validate.isObject(r._validateAttributes), 'validate attributes is an object');
        a.ok(validate.isObject(r._validateConstraints), 'validate constraints is an object');
    });
    
    QUnit.test('read-only accessors correctly access data', function(a){
        a.expect(6);
        var paramList = [42];
        var constraintsList = [{presence: true}, {presence: true}];
        var options = {format: 'flat'};
        var r = validateParams.apply(paramList, constraintsList, options);
        a.strictEqual(r.parameterList(), paramList, '.parameterList() returns correct referece');
        a.strictEqual(r.constraintList(), constraintsList, '.constraintList() returns correct referece');
        a.strictEqual(r.options(), options, '.options() returns correct referece');
        a.deepEqual(r.validateAttributes(), { param1: 42, param2: undefined }, '.validateAttributes() returns expected data structure');
        a.deepEqual(r.validateConstraints(), { param1: { presence: true }, param2: { presence: true } }, '.validateConstraints() returns expected data structure');
        a.deepEqual(r.errors(), [ "Param2 can't be blank" ], '.errors() returns expected value');
    });
});

QUnit.module('validateParams.getValidateInstance() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.getValidateInstance, 'function');
    });
    
    QUnit.test('returns a reference to a function', function(a){
        a.equal(typeof validateParams.getValidateInstance(), 'function');
    });
});

QUnit.module('validateParams.validateJS() function', {}, function(){
    QUnit.test('is an alias to validateParams.getValidateInstance()', function(a){
        a.strictEqual(validateParams.validateJS, validateParams.getValidateInstance);
    });
});

QUnit.module('validateParams.filterParameterOptions() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.filterParameterOptions, 'function');
    });
    
    QUnit.test('invalid data passed through', function(a){
        var mustPassUnaltered = dummyBasicTypesExcept('obj', 'arr');
        a.expect(mustPassUnaltered.length);
        mustPassUnaltered.forEach(function(tn){
            var t = DUMMY_BASIC_TYPES[tn];
            a.strictEqual(
                validateParams.filterParameterOptions(t.val),
                t.val,
                t.desc + ' passed un-altered'
            );
        });
    });
    
    QUnit.test('object keys correctly filtered', function(a){
        a.expect(6);
        
        // create constraints with a mix of validators and per-parameter options
        var testConstraint1 = {
            presence: true,
            url: {
                schemes: ['http', 'https'],
                allowLocal: true
            },
            vpopt_coerce: function(v){
                return typeof v === 'string' && !v.match(/\/$/) ? v + '/' : v;
            }
        };
        var testConstraint2 = {
            presence: true,
            url: {
                schemes: ['http', 'https'],
                allowLocal: true
            },
            paramOptions: {
                coerce: function(v){
                    return typeof v === 'string' && !v.match(/\/$/) ? v + '/' : v;
                }
            }
        };
        
        // filter the test constraints
        var filteredConstraint1 = validateParams.filterParameterOptions(testConstraint1);
        var filteredConstraint2 = validateParams.filterParameterOptions(testConstraint2);
        
        // make sure the validators were passed
        a.strictEqual(filteredConstraint1.presence, testConstraint1.presence, 'presence constraint passed through constraint 1');
        a.strictEqual(filteredConstraint2.presence, testConstraint2.presence, 'presence constraint passed through constraint 2');
        a.strictEqual(filteredConstraint1.url, testConstraint1.url, 'url constraint passed through constraint 1');
        a.strictEqual(filteredConstraint2.url, testConstraint2.url, 'url constraint passed through constraint 2');
        
        // make sure the per-parameter option was stripped
        a.strictEqual(typeof filteredConstraint1.vpopt_coerce, 'undefined', 'vpopt_coerce per-parameter option filtered out');
        a.strictEqual(typeof filteredConstraint2.paramOptions, 'undefined', 'paramOptions filtered out');
    });
});

QUnit.module('validateParams.isArguments() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.isArguments, 'function');
    });
    
    QUnit.test('function correctly detects Arguments object', function(a){
        a.expect(Object.keys(DUMMY_BASIC_TYPES).length + 1);
        
        // make sure all dummy basic types return false
        Object.keys(DUMMY_BASIC_TYPES).sort().forEach(function(tn){
            a.equal(
                validateParams.isArguments(DUMMY_BASIC_TYPES[tn].val),
                false,
                DUMMY_BASIC_TYPES[tn].desc + ' is not an Arguments object'
            );
        });
        
        // make sure an Arguments object returns true
        a.equal(
            validateParams.isArguments(arguments),
            true,
            'arguments recognised as Arguments object'
        );
    });
});

QUnit.module('validateParams.isPlainObject() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.isPlainObject, 'function');
    });
    
    QUnit.test('function correctly detects plain objects', function(a){
        var mustReject = dummyBasicTypesExcept('obj');
        mustReject.push('null'); // null should also return false
        mustReject.push('nan'); // NaN should also return false
        mustReject.push('obj_proto'); // prototyped objects should also return false
        a.expect(mustReject.length + 2);
        
        // make sure all the dummy data that should return false do return false
        mustReject.forEach(function(tn){
            var t = DUMMY_DATA[tn];
            a.equal(
                validateParams.isPlainObject(t.val),
                false,
                t.desc + ' is not a plain object'
            );
        });
        
        // make sure plain objects pass
        a.equal(
            validateParams.isPlainObject({}),
            true,
            'an empty object literal recognised as a plain object'
        );
        a.equal(
            validateParams.isPlainObject({a: 'b'}),
            true,
            'an object literal recognised as a plain object'
        );
    });
});

QUnit.module('validateParams.asOrdinal() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.asOrdinal, 'function');
    });
    
    QUnit.test('function produced expected outputs', function(a){
        a.expect(30);
        
        // test single-digit numbers
        a.equal(validateParams.asOrdinal(0), '0th');
        a.equal(validateParams.asOrdinal(1), '1st');
        a.equal(validateParams.asOrdinal(2), '2nd');
        a.equal(validateParams.asOrdinal(3), '3rd');
        a.equal(validateParams.asOrdinal(4), '4th');
        
        // test the teens
        a.equal(validateParams.asOrdinal(10), '10th');
        a.equal(validateParams.asOrdinal(11), '11th');
        a.equal(validateParams.asOrdinal(12), '12th');
        a.equal(validateParams.asOrdinal(13), '13th');
        a.equal(validateParams.asOrdinal(14), '14th');
        
        // test regular 2-digit numbers
        a.equal(validateParams.asOrdinal(30), '30th');
        a.equal(validateParams.asOrdinal(31), '31st');
        a.equal(validateParams.asOrdinal(32), '32nd');
        a.equal(validateParams.asOrdinal(33), '33rd');
        a.equal(validateParams.asOrdinal(34), '34th');
        
        // test three-digit numbers
        a.equal(validateParams.asOrdinal(100), '100th');
        a.equal(validateParams.asOrdinal(101), '101st');
        a.equal(validateParams.asOrdinal(102), '102nd');
        a.equal(validateParams.asOrdinal(103), '103rd');
        a.equal(validateParams.asOrdinal(104), '104th');
        a.equal(validateParams.asOrdinal(110), '110th');
        a.equal(validateParams.asOrdinal(111), '111th');
        a.equal(validateParams.asOrdinal(112), '112th');
        a.equal(validateParams.asOrdinal(113), '113th');
        a.equal(validateParams.asOrdinal(114), '114th');
        a.equal(validateParams.asOrdinal(120), '120th');
        a.equal(validateParams.asOrdinal(121), '121st');
        a.equal(validateParams.asOrdinal(122), '122nd');
        a.equal(validateParams.asOrdinal(123), '123rd');
        a.equal(validateParams.asOrdinal(124), '124th');
    });
});

QUnit.module('custom validators', {}, function(){
    QUnit.module('hasTypeof', {}, function(){
        QUnit.test('validator exists', function(a){
            a.equal(typeof validateParams.validators.hasTypeof, 'function');
        });
        
        QUnit.test('hasTypeof: true', function(a){
            var mustPass = dummyBasicTypesExcept('undef');
            a.expect(mustPass.length + 1);
            
            // make sure all types except undefined are passed
            mustPass.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.notOk(
                    validateParams([t.val], [{hasTypeof: true}]),
                    t.desc + ' passed'
                );
            });
            
            // make sure undefined is rejected
            a.throws(
                function(){
                    validateParams.assert([undefined], [{hasTypeof: true}]);
                },
                validateParams.ValidationError,
                'undefined is rejected'
            );
        });
        
        QUnit.test('hasTypeof: "A STRING"', function(a){
            var mustThrow = dummyBasicTypesExcept('num', 'undef');
            a.expect(mustThrow.length + 2);
            
            // make sure all types except number and undefined are rejected
            mustThrow.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.throws(
                    function(){
                        validateParams.assert([t.val], [{hasTypeof: 'number'}]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected'
                );
            });
            
            // make sure a number passes
            a.notOk(validateParams([42], [{hasTypeof: 'number'}]), 'number accepted');
            
            // make sure undefined passes
            a.notOk(validateParams([], [{hasTypeof: 'number'}]), 'undefined accepted');
        });
        
        QUnit.test('hasTypeof: AN_ARRAY', function(a){
            var mustThrowSingle = dummyBasicTypesExcept('num', 'undef');
            var mustThrowMultiple = dummyBasicTypesExcept('num', 'str', 'undef');
            a.expect(mustThrowSingle.length + mustThrowMultiple.length + 4);
            
            // make sure everything works as expected with just a single allowed type
            mustThrowSingle.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.throws(
                    function(){
                        validateParams.assert([t.val], [{hasTypeof: ['number']}]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected as a number'
                );
            });
            a.notOk(validateParams([42], [{hasTypeof: ['number']}]), 'accepted as a number');
            a.notOk(validateParams([], [{hasTypeof: ['number']}]), 'undefined accepted as a number');
            
            // make sure everything works as expectd with multiple allowed types
            mustThrowMultiple.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.throws(
                    function(){
                        validateParams.assert([t.val], [{hasTypeof: ['number', 'string']}]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected as a number or string'
                );
            });
            a.notOk(validateParams([42], [{hasTypeof: ['number', 'string']}]), 'accepted as a number or a string');
            a.notOk(validateParams([], [{hasTypeof: ['number', 'string']}]), 'undefined accepted as a number or a string');
        });
        
        QUnit.test('hasTypeof: { type(s): "A String"}', function(a){
            var mustThrow = dummyBasicTypesExcept('num', 'undef');
            a.expect((mustThrow.length * 2) + 4);
            
            var constraint1 = { hasTypeof: { type: 'number' } };
            var constraint2 = { hasTypeof: { types: 'number' } };
            
            // make sure all types except number and undefined are rejected
            mustThrow.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.throws(
                    function(){
                        validateParams.assert([t.val], [constraint1]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected via type attribute'
                );
                a.throws(
                    function(){
                        validateParams.assert([t.val], [constraint2]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected via types attribute'
                );
            });
            
            // make sure a number passes
            a.notOk(validateParams([42], [constraint1]), 'number accepted via type attribute');
            a.notOk(validateParams([42], [constraint2]), 'number accepted via types attribute');
            
            // make sure undefined passes
            a.notOk(validateParams([], [constraint1]), 'undefined accepted via type attribute');
            a.notOk(validateParams([], [constraint2]), 'undefined accepted via types attribute');
        });
        
        QUnit.test('hasTypeof: { types: AN_ARRAY }', function(a){
            var mustThrowSingle = dummyBasicTypesExcept('num', 'undef');
            var mustThrowMultiple = dummyBasicTypesExcept('num', 'str', 'undef');
            a.expect(mustThrowSingle.length + mustThrowMultiple.length + 4);
            
            var numConstraint = { hasTypeof: { types: ['number'] } };
            var numStrConstraint = { hasTypeof: { types: ['number', 'string'] } };
            
            // make sure everything works as expected with just a single allowed type
            mustThrowSingle.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.throws(
                    function(){
                        validateParams.assert([t.val], [numConstraint]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected as a number'
                );
            });
            a.notOk(validateParams([42], [numConstraint]), '42 accepted as a number');
            a.notOk(validateParams([], [numConstraint]), 'undefined accepted as a number');
            
            // make sure everything works as expectd with multiple allowed types
            mustThrowMultiple.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.throws(
                    function(){
                        validateParams.assert([t.val], [numStrConstraint]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected as a number or string'
                );
            });
            a.notOk(validateParams([42], [numStrConstraint]), '42 accepted as a number or a string');
            a.notOk(validateParams([], [numStrConstraint]), 'undefined accepted as a number or a string');
        });
        
        QUnit.test("'invert', 'notEqual', 'notAnyOf' & 'not' options", function(a){
            var mustPassSingle = dummyBasicTypesExcept('num');
            var mustPassMultiple = dummyBasicTypesExcept('num', 'str');
            a.expect((mustPassSingle.length * 4) + (mustPassMultiple.length * 4) + 9);
            
            var singleConstraintInvert = {
                hasTypeof: {
                    type: 'number',
                    invert: true
                }
            };
            var singleConstraintNotEqual = {
                hasTypeof: {
                    type: 'number',
                    notEqual: true
                }
            };
            var singleConstraintNotAnyOf = {
                hasTypeof: {
                    type: 'number',
                    notAnyOf: true
                }
            };
            var singleConstraintNot = {
                hasTypeof: {
                    type: 'number',
                    not: true
                }
            };
            var multipleConstraintInvert = {
                hasTypeof: {
                    types: ['number', 'string'],
                    invert: true
                }
            };
            var multipleConstraintNotEqual = {
                hasTypeof: {
                    types: ['number', 'string'],
                    notEqual: true
                }
            };
            var multipleConstraintNotAnyOf = {
                hasTypeof: {
                    types: ['number', 'string'],
                    notAnyOf: true
                }
            };
            var multipleConstraintNot = {
                hasTypeof: {
                    types: ['number', 'string'],
                    not: true
                }
            };
            
            // make sure everything works as expected when a single type is specified
            mustPassSingle.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.notOk(validateParams([t.val], [singleConstraintInvert]), t.desc + " accepted as anything but a number via 'invert' option");
                a.notOk(validateParams([t.val], [singleConstraintNotEqual]), t.desc + " accepted as anything but a number via 'notEqual' option");
                a.notOk(validateParams([t.val], [singleConstraintNotAnyOf]), t.desc + " accepted as anything but a number via 'notAnyOf' option");
                a.notOk(validateParams([t.val], [singleConstraintNot]), t.desc + " accepted as anything but a number via 'not' option");
            });
            a.throws(
                function(){
                    validateParams.assert([42], [singleConstraintInvert]);
                },
                validateParams.ValidationError,
                "42 rejeced as anything but a number via 'invert' option"
            );
            a.throws(
                function(){
                    validateParams.assert([42], [singleConstraintNotEqual]);
                },
                validateParams.ValidationError,
                "42 rejeced as anything but a number via 'notEqual' option"
            );
            a.throws(
                function(){
                    validateParams.assert([42], [singleConstraintNotAnyOf]);
                },
                validateParams.ValidationError,
                "42 rejeced as anything but a number via 'notAnyOf' option"
            );
            a.throws(
                function(){
                    validateParams.assert([42], [singleConstraintNot]);
                },
                validateParams.ValidationError,
                "42 rejeced as anything but a number via 'not' option"
            );
            
            // make sure everything works as expected when a multiple types are specified
            mustPassMultiple.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.notOk(validateParams([t.val], [multipleConstraintInvert]), t.desc + " accepted as anything but a number or a string via 'invert' option");
                a.notOk(validateParams([t.val], [multipleConstraintNotEqual]), t.desc + " accepted as anything but a number or a string via 'notEqual' option");
                a.notOk(validateParams([t.val], [multipleConstraintNotAnyOf]), t.desc + " accepted as anything but a number or a string via 'notAnyOf' option");
                a.notOk(validateParams([t.val], [multipleConstraintNot]), t.desc + " accepted as anything but a number or a string via 'not' option");
            });
            a.throws(
                function(){
                    validateParams.assert([42], [multipleConstraintInvert]);
                },
                validateParams.ValidationError,
                "42 rejeced as anything but a number or a string via 'invert' option"
            );
            a.throws(
                function(){
                    validateParams.assert([42], [multipleConstraintNotEqual]);
                },
                validateParams.ValidationError,
                "42 rejeced as anything but a number or a string via 'notEqual' option"
            );
            a.throws(
                function(){
                    validateParams.assert([42], [multipleConstraintNotAnyOf]);
                },
                validateParams.ValidationError,
                "42 rejeced as anything but a number or a string via 'notAnyOf' option"
            );
            a.throws(
                function(){
                    validateParams.assert([42], [multipleConstraintNot]);
                },
                validateParams.ValidationError,
                "42 rejeced as anything but a number or a string via 'not' option"
            );
            
            // make sure specifying undefined in the type list doesn't overvride the implicit acceptance of undefined
            a.notOk(
                validateParams([undefined], [{hasTypeof: {types: ['undefined', 'string'], invert: true}}]),
                'listing undefined in the type list while in inverted mode does not override the implicit acceptance of undefined'
            );
        });
        
        QUnit.test("'notUndefined', 'defined' & 'required' options", function(a){
            a.expect(12);
            
            // test the un-inverted use-case
            var notUndefinedContraint = {
                hasTypeof: {
                    type: 'number',
                    notUndefined: true
                }
            };
            var definedContraint = {
                hasTypeof: {
                    type: 'number',
                    defined: true
                }
            };
            var requiredContraint = {
                hasTypeof: {
                    type: 'number',
                    required: true
                }
            };
            a.throws(
                function(){
                    validateParams.assert([undefined], [notUndefinedContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'notUndefined' option on type number"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [definedContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'defined' option on type number"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [requiredContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'required' option on type number"
            );
            a.notOk(validateParams([42], [notUndefinedContraint]), "42 accepted with 'notUndefined' option on type number");
            a.notOk(validateParams([42], [definedContraint]), "42 accepted with 'defined' option on type number");
            a.notOk(validateParams([42], [requiredContraint]), "42 accepted with 'required' option on type number");
            
            // test the inverted use-case
            var notUndefinedContraintInverted = {
                hasTypeof: {
                    type: 'number',
                    invert: true,
                    notUndefined: true
                }
            };
            var definedContraintInverted = {
                hasTypeof: {
                    type: 'number',
                    invert: true,
                    defined: true
                }
            };
            var requiredContraintInverted = {
                hasTypeof: {
                    type: 'number',
                    invert: true,
                    required: true
                }
            };
            a.throws(
                function(){
                    validateParams.assert([undefined], [notUndefinedContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'notUndefined' option on type anything but number"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [definedContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'defined' option on type anything but number"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [requiredContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'required' option on type anything but number"
            );
            a.notOk(validateParams(['stuff'], [notUndefinedContraintInverted]), "'stuff' accepted with 'notUndefined' option on type anything but number");
            a.notOk(validateParams(['stuff'], [definedContraintInverted]), "'stuff' accepted with 'defined' option on type anything but number");
            a.notOk(validateParams(['stuff'], [requiredContraintInverted]), "'stuff' accepted with 'required' option on type anything but number");
        });
    });
    
    QUnit.module('isInstanceof', {}, function(){
        QUnit.test('validator exists', function(a){
            a.equal(typeof validateParams.validators.isInstanceof, 'function');
        });
        
        QUnit.test('isInstanceof: true', function(a){
            var mustThrow = dummyBasicTypesExcept('obj', 'fn', 'arr');
            a.expect(mustThrow.length + 1);
            
            // make sure non-object basic types reject, including undefined
            mustThrow.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.throws(
                    function(){
                        validateParams.assert([t.val], [ { isInstanceof: true } ]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected'
                );
            });
            
            // make sure a random prototyped object passes
            a.notOk(
                validateParams([new Date()], [{isInstanceof: true}]),
                'An instance of Date passed'
            );
        });
        
        QUnit.test('isInstanceof: { prototypes: AN_ARRAY }', function(a){
            var mustThrow = dummyBasicTypesExcept('obj', 'fn', 'arr', 'undef');
            a.expect((mustThrow.length * 2) + 6);
            
            var singleProtoConstraint = {isInstanceof: [Error]};
            var multiProtoConstraint = {isInstanceof: [Error, Date]};
            
            // make sure non-object basic types reject
            mustThrow.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.throws(
                    function(){
                        validateParams.assert([t.val], [singleProtoConstraint]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected by single-prototype constraint'
                );
                a.throws(
                    function(){
                        validateParams.assert([t.val], [multiProtoConstraint]);
                    },
                    validateParams.ValidationError,
                    t.desc + ' rejected by multi-prototype constraint'
                );
            });
            
            // make sure undefined accepts
            a.notOk(validateParams([], [singleProtoConstraint]), 'undefined accepted by single-prototype constraint');
            a.notOk(validateParams([], [multiProtoConstraint]), 'undefined accepted by multi-prototype constraint');
            
            // make sure specified prototypes accept
            a.notOk(validateParams([new Error('blah')], [singleProtoConstraint]), 'Error object accepted by single-prototype constraint');
            a.notOk(validateParams([new Error('blah')], [multiProtoConstraint]), 'Error object accepted by multi-prototype constraint');
            a.notOk(validateParams([new Date()], [multiProtoConstraint]), 'Date object accepted by multi-prototype constraint');
            
            // make sure sub-classes of specified prototypes accept
            a.notOk(validateParams([new TypeError('blah')], [singleProtoConstraint]), 'Sub-class of specified prototype accepted');
        });
        
         QUnit.test("'invert', 'notEqual', 'notAnyOf' & 'not' options", function(a){
            a.expect(28);
            
            var singleConstraintInvert = {
                isInstanceof: {
                    prototypes: [Error],
                    invert: true
                }
            };
            var singleConstraintNotEqual = {
                isInstanceof: {
                    prototypes: [Error],
                    notEqual: true
                }
            };
            var singleConstraintNotAnyOf = {
                isInstanceof: {
                    prototypes: [Error],
                    notAnyOf: true
                }
            };
            var singleConstraintNot = {
                isInstanceof: {
                    prototypes: [Error],
                    not: true
                }
            };
            var multiConstraintInvert = {
                isInstanceof: {
                    prototypes: [Error, Date],
                    invert: true
                }
            };
            var multiConstraintNotEqual = {
                isInstanceof: {
                    prototypes: [Error, Date],
                    notEqual: true
                }
            };
            var multiConstraintNotAnyOf = {
                isInstanceof: {
                    prototypes: [Error, Date],
                    notAnyOf: true
                }
            };
            var multiConstraintNot = {
                isInstanceof: {
                    prototypes: [Error, Date],
                    not: true
                }
            };
            
            // make sure everything works as expected when a single prototype is specified
            a.notOk(validateParams([new Date()], [singleConstraintInvert]), "An instance of Date accepted as any object but an Error via 'invert' option");
            a.notOk(validateParams([new Date()], [singleConstraintNotEqual]), "An instance of Date accepted as any object but an Error via 'notEqual' option");
            a.notOk(validateParams([new Date()], [singleConstraintNotAnyOf]), "An instance of Date accepted as any object but an Error via 'notAnyOf' option");
            a.notOk(validateParams([new Date()], [singleConstraintNot]), "An instance of Date accepted as any object but an Error via 'not' option");
            a.throws(
                function(){
                    validateParams.assert([new Error()], [singleConstraintInvert]);
                },
                validateParams.ValidationError,
                "An instance of Error rejeced as any object but an Error via 'invert' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Error()], [singleConstraintNotEqual]);
                },
                validateParams.ValidationError,
                "An instance of Error rejeced as any object but an Error via 'notEqual' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Error()], [singleConstraintNotAnyOf]);
                },
                validateParams.ValidationError,
                "An instance of Error rejeced as any object but an Error via 'notAnyOf' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Error()], [singleConstraintNot]);
                },
                validateParams.ValidationError,
                "An instance of Error rejeced as any object but an Error via 'not' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [singleConstraintInvert]);
                },
                validateParams.ValidationError,
                "An instance of TypeError rejeced as any object but an Error via 'invert' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [singleConstraintNotEqual]);
                },
                validateParams.ValidationError,
                "An instance of TypeError rejeced as any object but an Error via 'notEqual' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [singleConstraintNotAnyOf]);
                },
                validateParams.ValidationError,
                "An instance of TypeError rejeced as any object but an Error via 'notAnyOf' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [singleConstraintNot]);
                },
                validateParams.ValidationError,
                "An instance of TypeError rejeced as any object but an Error via 'not' option"
            );
            
            // make sure everything works as expected when two prototypes are specified
            a.notOk(validateParams([new RegExp()], [multiConstraintInvert]), "An instance of RegExp accepted as any object but an Error or a Date via 'invert' option");
            a.notOk(validateParams([new RegExp()], [multiConstraintNotEqual]), "An instance of RegExp accepted as any object but an Error or a Date via 'notEqual' option");
            a.notOk(validateParams([new RegExp()], [multiConstraintNotAnyOf]), "An instance of RegExp accepted as any object but an Error or a Date via 'notAnyOf' option");
            a.notOk(validateParams([new RegExp()], [multiConstraintNot]), "An instance of RegExp accepted as any object but an Error or a Date via 'not' option");
            a.throws(
                function(){
                    validateParams.assert([new Error()], [multiConstraintInvert]);
                },
                validateParams.ValidationError,
                "An instance of Error rejeced as any object but an Error or a Date via 'invert' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Error()], [multiConstraintNotEqual]);
                },
                validateParams.ValidationError,
                "An instance of Error rejeced as any object but an Error or a Date via 'notEqual' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Error()], [multiConstraintNotAnyOf]);
                },
                validateParams.ValidationError,
                "An instance of Error rejeced as any object but an Error or a Date via 'notAnyOf' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Error()], [multiConstraintNot]);
                },
                validateParams.ValidationError,
                "An instance of Error rejeced as any object but an Error or a Date via 'not' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [multiConstraintInvert]);
                },
                validateParams.ValidationError,
                "An instance of TypeError rejeced as any object but an Error or a Date via 'invert' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [multiConstraintNotEqual]);
                },
                validateParams.ValidationError,
                "An instance of TypeError rejeced as any object but an Error or a Date via 'notEqual' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [multiConstraintNotAnyOf]);
                },
                validateParams.ValidationError,
                "An instance of TypeError rejeced as any object but an Error or a Date via 'notAnyOf' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [multiConstraintNot]);
                },
                validateParams.ValidationError,
                "An instance of TypeError rejeced as any object but an Error or a Date via 'not' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Date()], [multiConstraintInvert]);
                },
                validateParams.ValidationError,
                "An instance of Date rejeced as any object but an Error or a Date via 'invert' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Date()], [multiConstraintNotEqual]);
                },
                validateParams.ValidationError,
                "An instance of Date rejeced as any object but an Error or a Date via 'notEqual' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Date()], [multiConstraintNotAnyOf]);
                },
                validateParams.ValidationError,
                "An instance of Date rejeced as any object but an Error or a Date via 'notAnyOf' option"
            );
            a.throws(
                function(){
                    validateParams.assert([new Date()], [multiConstraintNot]);
                },
                validateParams.ValidationError,
                "An instance of Date rejeced as any object but an Error or a Date via 'not' option"
            );
        });
         
        QUnit.test("'notUndefined', 'defined' & 'required' options", function(a){
            a.expect(15);
            
            // test the un-inverted use-case
            var notUndefinedContraint = {
                isInstanceof: {
                    prototypes: [Error],
                    notUndefined: true
                }
            };
            var definedContraint = {
                isInstanceof: {
                    prototypes: [Error],
                    defined: true
                }
            };
            var requiredContraint = {
                isInstanceof: {
                    prototypes: [Error],
                    required: true
                }
            };
            a.throws(
                function(){
                    validateParams.assert([undefined], [notUndefinedContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'notUndefined' option on prototype Error"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [definedContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'defined' option on prototype Error"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [requiredContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'required' option on prototype Error"
            );
            a.notOk(validateParams([new Error()], [notUndefinedContraint]), "instance of Error accepted with 'notUndefined' option on prototype Error");
            a.notOk(validateParams([new Error()], [definedContraint]), "instance of Error accepted with 'defined' option on prototype Error");
            a.notOk(validateParams([new Error()], [requiredContraint]), "instance of Error accepted with 'required' option on prototype Error");
            a.notOk(validateParams([new TypeError()], [notUndefinedContraint]), "instance of Error accepted with 'notUndefined' option on prototype Error");
            a.notOk(validateParams([new TypeError()], [definedContraint]), "instance of TypeError accepted with 'defined' option on prototype Error");
            a.notOk(validateParams([new TypeError()], [requiredContraint]), "instance of TypeError accepted with 'required' option on prototype Error");
            
            // test the inverted use-case
            var notUndefinedContraintInverted = {
                isInstanceof: {
                    prototypes: [Error],
                    invert: true,
                    notUndefined: true
                }
            };
            var definedContraintInverted = {
                isInstanceof: {
                    prototypes: [Error],
                    invert: true,
                    defined: true
                }
            };
            var requiredContraintInverted = {
                isInstanceof: {
                    prototypes: [Error],
                    invert: true,
                    required: true
                }
            };
            a.throws(
                function(){
                    validateParams.assert([undefined], [notUndefinedContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'notUndefined' option on any object but instances of Error"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [definedContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'defined' option on any object but instances of Error"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [requiredContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'required' option on any object but instances of Error"
            );
            a.notOk(validateParams([new Date()], [notUndefinedContraintInverted]), "instance of Date accepted with 'notUndefined' option on any object but instances of Error");
            a.notOk(validateParams([new Date()], [definedContraintInverted]), "instance of Date accepted with 'defined' option on any object but instances of Error");
            a.notOk(validateParams([new Date()], [requiredContraintInverted]), "instance of Date accepted with 'required' option on any object but instances of Error");
        });
    });
    
    QUnit.module('validator aliases', {}, function(){
        QUnit.test('hasTypeOf maps to hasTypeof', function(a){
            a.strictEqual(validateParams.validators.hasTypeOf, validateParams.validators.hasTypeof);
        });
        
        QUnit.test('isInstanceOf maps to isInstanceof', function(a){
            a.strictEqual(validateParams.validators.isInstanceOf, validateParams.validators.isInstanceof);
        });
    });
});