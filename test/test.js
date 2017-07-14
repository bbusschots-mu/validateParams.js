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

QUnit.module('validateParams.validate() function',
    {
        beforeEach: function(){
            this.dummyFn = function(){
                var result = validateParams.validate(arguments, [
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
            a.equal(typeof validateParams.validate, 'function');
        });
        
        QUnit.test('parameter number validation', function(a){
            a.expect(4);
            a.throws(
                function(){ validateParams.validate(); },
                TypeError,
                'first argument required'
            );
            a.throws(
                function(){ validateParams.validate([]); },
                TypeError,
                'second argument required'
            );
            a.ok((function(){ validateParams.validate([], []); return true; })(), 'third argument is not required');
            a.ok((function(){ validateParams.validate([], [], {}); return true; })(), 'third argument is allowed');
        });
        
        QUnit.test('parameter list validation', function(a){
            var mustThrow = dummyBasicTypesExcept('arr');
            a.expect(mustThrow.length + 2);
            
            // make sure all the basic types excep array do indeed throw
            mustThrow.forEach(function(tn){
                a.throws(
                    function(){ validateParams.validate(DUMMY_BASIC_TYPES[tn].val, []); },
                    TypeError,
                    'parameter list not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
                );
            });
            
            // make sure an array does not throw
            a.ok((function(){ validateParams.validate([], []); return true; })(), 'parameter list can be an array');
            
            // make sure an Arguments object does not throw
            a.ok((function(){ validateParams.validate(arguments, []); return true; })(), 'parameter list can be an Arguments object');
        });
        
        QUnit.test('constraint list validation', function(a){
            var mustThrow = dummyBasicTypesExcept('arr');
            a.expect(mustThrow.length + 1);
            
            // make sure all the basic types excep array do indeed throw
            mustThrow.forEach(function(tn){
                a.throws(
                    function(){ validateParams.validate([], DUMMY_BASIC_TYPES[tn].val); },
                    TypeError,
                    'constraint list not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
                );
            });
            
            // make sure an array does not throw
            a.ok((function(){ validateParams.validate([], []); return true; })(), 'constraint list can be an array');
        });
        
        QUnit.test('options validation', function(a){
            var mustThrow = dummyBasicTypesExcept('obj', 'undef');
            a.expect(mustThrow.length + 1);
            
            // make sure all the basic types excep array do indeed throw
            mustThrow.forEach(function(tn){
                a.throws(
                    function(){ validateParams.validate([], [], DUMMY_BASIC_TYPES[tn].val); },
                    TypeError,
                    'options not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
                );
            });
            
            // make sure an object does not throw
            a.ok((function(){ validateParams.validate([], [], {}); return true; })(), 'options can be an object');
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
        
        QUnit.test('option: fatal', function(a){
            a.expect(5);
            
            // create a dummy function that validates params with options.fatal=true
            var fatalFn = function(){
                validateParams.validate(arguments,
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
        
        QUnit.test('option: injectDefaults', function(a){
            a.expect(6);
            
            // define a constranint that specifies both kinds of default
            var injectingConstraint = {
                presence: true,
                vpopt_defaultWhenUndefined: false,
                vpopt_defaultWhenEmpty: true
            };
            
            // make sure both kinds of default are applied by default
            var params = [];
            validateParams.validate(params, [injectingConstraint]);
            a.strictEqual(params[0], false, 'undefined correctly defaulted by default');
            params = [''];
            validateParams.validate(params, [injectingConstraint]);
            a.strictEqual(params[0], true, 'empty string correctly defaulted by default');
            
            // make sure both kinds of default are applied when options.injectDefaults is explicitly set to true
            params = [];
            validateParams.validate(params, [injectingConstraint], {injectDefaults: true});
            a.strictEqual(params[0], false, 'undefined correctly defaulted when options.injectDefaults explicitly set to true');
            params = [''];
            validateParams.validate(params, [injectingConstraint], {injectDefaults: true});
            a.strictEqual(params[0], true, 'empty string correctly defaulted when options.injectDefaults explicitly set to true');
            
            // make sure neither kind of default is applied when options.injectDefaults is set to false
            params = [];
            validateParams.validate(params, [injectingConstraint], {injectDefaults: false});
            a.strictEqual(typeof params[0], 'undefined', 'undefined correctly left un-changed when options.injectDefaults set to false');
            params = [''];
            validateParams.validate(params, [injectingConstraint], {injectDefaults: false});
            a.strictEqual(params[0], '', 'empty string correctly left un-changed when options.injectDefaults set to false');
        });
        
        QUnit.test('option: coerce', function(a){
            a.expect(3);
            
            // define a constranint that contains a coercion
            var coercingConstraint = {
                presence: true,
                vpopt_coerce: function(){ return 42; }
            };
            
            // make sure the coercion is applied by default
            var params1 = [1];
            validateParams.validate(params1, [coercingConstraint]);
            a.equal(params1[0], 42, 'coercion applied by default');
            
            // make sure the coercion is applied when options.coerce is explicitly set to true
            var params2 = [2];
            validateParams.validate(params2, [coercingConstraint], {coerce: true});
            a.equal(params2[0], 42, 'coercion applied with options.coerce=true');
            
            // make sure the coercion is not applied when options.coerce is explicitly set to false
            var params3 = [3];
            validateParams.validate(params3, [coercingConstraint], {coerce: false});
            a.equal(params3[0], 3, 'coercion not applied with options.coerce=false');
        });
        
        QUnit.test("per-parameter option 'name'", function(a){
            a.expect(2);
            var r = validateParams.validate(
                [42, 'stuff', true],
                [
                    {
                        vpopt_name: 'p0',
                        numericality: { onlyInteger: true }
                    },
                    {
                        paramOptions: {name: 'p1' },
                        length: {minimum: 1}
                    },
                    { hasTypeof: 'boolean' }
                ]
            );
            a.deepEqual(
                r.validateAttributes(),
                { p0: 42, p1: 'stuff', param3: true },
                'attributes corrently generated with custom names'
            );
            a.deepEqual(
                r.validateConstraints(),
                {
                    p0: { numericality: { onlyInteger: true } },
                    p1: { length: {minimum: 1} },
                    param3: { hasTypeof: 'boolean' }
                },
                'constraints corrently generated with custom names'
            );
        });
        
        QUnit.module('nested constraints',
            {
                beforeEach: function(){
                    // a universal constraint for dictionaries requiring all values to be strings
                    this.uniDictStrCons = {
                        dictionary: {
                            valueConstraints: { hasTypeof: 'string' }
                        }
                    };
                    
                    //a per-key constraint requiring a string named a
                    this.pkaDictStrCons = {
                        dictionary: {
                            mapConstraints: {
                                a: {
                                    hasTypeof: 'string',
                                    presence: true
                                }
                            }
                        }
                    };
                    
                    // a mix of per-key and universal constraints with no overlap
                    this.ukncDictStrCons = {
                        dictionary: {
                            valueConstraints: { hasTypeof: 'string' },
                            mapConstraints: { a: { presence: true } }
                        }
                    };
                    
                    // a mix of per-key and universal constraints that overlap
                    this.ukcDictStrCons = {
                        dictionary: {
                            valueConstraints: { hasTypeof: 'string' },
                            mapConstraints: {
                                a: {
                                    presence: true,
                                    hasTypeof: 'number'
                                }
                            }
                        }
                    };
                    
                    // a deep-nested dictionary constraint
                    this.deepDictStrCons = {
                        dictionary: {
                            mapConstraints: {
                                a: {
                                    dictionary: {
                                        valueConstraints: { hasTypeof: 'string' }
                                    }
                                }
                            }
                        }
                    };
                    
                    // a nested list constraint
                    this.listStrCons = {
                        list: {
                            valueConstraints: { hasTypeof: 'string' }
                        }
                    };
                    
                    // a deep-nested list constraint
                    this.deepListStrCons = {
                        list: {
                            valueConstraints: {
                                list: {
                                    valueConstraints: { hasTypeof: 'string' }
                                }
                            }
                        }
                    };
                    
                    // a deep-nested mixture of lists and dictionaries
                    this.deepNestedCons = {
                        list: {
                            valueConstraints: {
                                dictionary: {
                                    valueConstraints: { hasTypeof: 'string' }
                                }
                            }
                        }
                    };
                }
            },
            function(){
                QUnit.test('nested constraints generation on dictionary with universal constraints', function(a){
                    a.expect(3);
                    var r = validateParams.validate([], [this.uniDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } },
                        'no nested constraint added when param undefined'
                    );
                    r = validateParams.validate([{}], [this.uniDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } },
                        'no nested constraint added for empty object'
                    );
                    r = validateParams.validate([{a: 'b'}], [this.uniDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: {
                                dictionary: {
                                    valueConstraints: {
                                        hasTypeof: 'string'
                                    }
                                }
                            },
                            'param1.a':{
                                hasTypeof: 'string'
                            }
                        },
                        'nested constraint added for single key'
                    );
                });
                
                QUnit.test('nested constraints generation on dictionary with key-specific constraints', function(a){
                    a.expect(3);
                    var r = validateParams.validate([], [this.pkaDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { dictionary: { mapConstraints: { a: { hasTypeof: 'string', presence: true } } } } },
                        'no nested constraint added when param undefined'
                    );
                    r = validateParams.validate([{}], [this.pkaDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { mapConstraints: { a: { hasTypeof: 'string', presence: true } } } },
                            'param1.a': { hasTypeof: 'string', presence: true }
                        },
                        'nested constraint added for per-key constraint even when param passed is empty object'
                    );
                    r = validateParams.validate([{a: 'b'}], [this.pkaDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { mapConstraints: { a: { hasTypeof: 'string', presence: true } } } },
                            'param1.a': { hasTypeof: 'string', presence: true }
                        },
                        'nested constraint added for per-key constraint when param passed is object with specified key'
                    );
                });
                
                QUnit.test("nested constraints generation on dictionary with key-specific & universal constraints that don't overlap", function(a){
                    a.expect(3);
                    var r = validateParams.validate([], [this.ukncDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { dictionary: { mapConstraints: { a: { presence: true } }, valueConstraints: { hasTypeof: 'string' } } } },
                        'no nested constraint added when param undefined'
                    );
                    r = validateParams.validate([{}], [this.ukncDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { valueConstraints: { hasTypeof: 'string' }, mapConstraints: { a: { presence: true } } } },
                            'param1.a': { hasTypeof: 'string', presence: true }
                        },
                        'nested constraint added for key with per-key and universal constraints even when param passed is empty object'
                    );
                    r = validateParams.validate([{a: 'b'}], [this.ukncDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { valueConstraints: { hasTypeof: 'string' }, mapConstraints: { a: { presence: true } } } },
                            'param1.a': { hasTypeof: 'string', presence: true }
                        },
                        'nested constraint added for key with per-key and universal constraints when param passed is object with specified key'
                    );
                });
                
                QUnit.test("nested constraints generation on dictionary with key-specific & universal constraints that overlap", function(a){
                    a.expect(4);
                    var r = validateParams.validate([], [this.ukcDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { dictionary: { mapConstraints: { a: { presence: true, hasTypeof: 'number' } }, valueConstraints: { hasTypeof: 'string' } } } },
                        'no nested constraint added when param undefined'
                    );
                    r = validateParams.validate([{}], [this.ukcDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { mapConstraints: { a: { presence: true, hasTypeof: 'number' } }, valueConstraints: { hasTypeof: 'string' } } },
                            'param1.a': { hasTypeof: 'number', presence: true }
                        },
                        'nested constraint added for key with per-key and universal constraints even when param passed is empty object'
                    );
                    r = validateParams.validate([{a: 'b'}], [this.ukcDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { mapConstraints: { a: { presence: true, hasTypeof: 'number' } }, valueConstraints: { hasTypeof: 'string' } } },
                            'param1.a': { hasTypeof: 'number', presence: true }
                        },
                        'nested constraint added for key with per-key and universal constraints when param passed is object with specified key'
                    );
                    r = validateParams.validate([{a: 'b', c: 'd'}], [this.ukcDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { mapConstraints: { a: { presence: true, hasTypeof: 'number' } }, valueConstraints: { hasTypeof: 'string' } } },
                            'param1.a': { hasTypeof: 'number', presence: true },
                            'param1.c': { hasTypeof: 'string'}
                        },
                        '2 nested constraints added when called with object with specified key and another on constraint with both universal and per-key constraints'
                    );
                });
                
                QUnit.test('deep nested constraints generations with dictionaries', function(a){
                    a.expect(4);
                    var r = validateParams.validate([], [this.deepDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { dictionary: { mapConstraints: { a: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } } } } },
                        'no nested constraint added when param undefined'
                    );
                    r = validateParams.validate([{}], [this.deepDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { mapConstraints: { a: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } } } },
                            'param1.a': { dictionary: { valueConstraints: { hasTypeof: 'string' } } }
                        },
                        'first nested constraint added when passed empty object, but not second-level nested constraint'
                    );
                    r = validateParams.validate([{a: {}}], [this.deepDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { mapConstraints: { a: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } } } },
                            'param1.a': { dictionary: { valueConstraints: { hasTypeof: 'string' } } }
                        },
                        'first nested constraint added when passed object containing empty object, but not second-level nested constraint'
                    );
                    r = validateParams.validate([{a: {b: 'c'}}], [this.deepDictStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { dictionary: { mapConstraints: { a: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } } } },
                            'param1.a': { dictionary: { valueConstraints: { hasTypeof: 'string' } } },
                            'param1.a.b': { hasTypeof: 'string' } 
                        },
                        'first and second level nested constraints added when passed two-level object'
                    );
                });
                
                QUnit.test('nested constraints generation on list', function(a){
                    a.expect(4);
                    var r = validateParams.validate([], [this.listStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { list: { valueConstraints: { hasTypeof: 'string' } } } },
                        'no nested constraint added when param undefined'
                    );
                    r = validateParams.validate([[]], [this.listStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { list: { valueConstraints: { hasTypeof: 'string' } } } },
                        'no nested constraint added for empty array'
                    );
                    r = validateParams.validate([['a']], [this.listStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: {
                                list: {
                                    valueConstraints: {
                                        hasTypeof: 'string'
                                    }
                                }
                            },
                            'param1.0':{
                                hasTypeof: 'string'
                            }
                        },
                        'nested constraint added for single element array'
                    );
                    r = validateParams.validate([['a', 'b','c']], [this.listStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: {
                                list: {
                                    valueConstraints: {
                                        hasTypeof: 'string'
                                    }
                                }
                            },
                            'param1.0':{ hasTypeof: 'string' },
                            'param1.1':{ hasTypeof: 'string' },
                            'param1.2':{ hasTypeof: 'string' }
                        },
                        'nested constraints added for multi-element array'
                    );
                });
                
                QUnit.test('deep nested constraints generation with lists', function(a){
                    a.expect(4);
                    var r = validateParams.validate([], [this.deepListStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { list: { valueConstraints: { list: { valueConstraints: { hasTypeof: 'string' } } } } } },
                        'no nested constraint added when param undefined'
                    );
                    r = validateParams.validate([[]], [this.deepListStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { list: { valueConstraints: { list: { valueConstraints: { hasTypeof: 'string' } } } } } },
                        'no nested constraint added when passed empty top-level array'
                    );
                    r = validateParams.validate([[[]]], [this.deepListStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { list: { valueConstraints: { list: { valueConstraints: { hasTypeof: 'string' } } } } },
                            'param1.0': { list: { valueConstraints: { hasTypeof: 'string' } } }
                        },
                        'first nested constraint added when passed list containing single empty list, but no second-level nested constraints added'
                    );
                    r = validateParams.validate([[['a']]], [this.deepListStrCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { list: { valueConstraints: { list: { valueConstraints: { hasTypeof: 'string' } } } } },
                            'param1.0': { list: { valueConstraints: { hasTypeof: 'string' } } },
                            'param1.0.0': { hasTypeof: 'string' }
                        },
                        'first and second level nested constraints added when passed a string in an array in an array'
                    );
                });
                
                // deepNestedCons
                QUnit.test('deep nested constraints generation with lists and dictionaries', function(a){
                    a.expect(4);
                    var r = validateParams.validate([], [this.deepNestedCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { list: { valueConstraints: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } } } },
                        'no nested constraint added when param undefined'
                    );
                    r = validateParams.validate([[]], [this.deepNestedCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        { param1: { list: { valueConstraints: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } } } },
                        'no nested constraint added when passed empty top-level array'
                    );
                    r = validateParams.validate([[{}]], [this.deepNestedCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { list: { valueConstraints: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } } },
                            'param1.0': { dictionary: { valueConstraints: { hasTypeof: 'string' } } }
                        },
                        'first nested constraint added when passed list containing single empty object, but no second-level nested constraints added'
                    );
                    r = validateParams.validate([[{a: 'b'}]], [this.deepNestedCons]);
                    a.deepEqual(
                        r._validateConstraints,
                        {
                            param1: { list: { valueConstraints: { dictionary: { valueConstraints: { hasTypeof: 'string' } } } } },
                            'param1.0': { dictionary: { valueConstraints: { hasTypeof: 'string' } } },
                            'param1.0.a': { hasTypeof: 'string' }
                        },
                        'first and second level nested constraints added when passed a string in a plain object in an array'
                    );
                });
            
                QUnit.test('un-nested dictionary validation with only universal constraints', function(a){
                    a.expect(6);
                    a.ok(validateParams.validate([], [this.uniDictStrCons]).pass(),  "undefined passes universal constraint {hasTypeof: 'string'} (dictionary not required to be defined)");
                    a.ok(validateParams.validate([{}], [this.uniDictStrCons]).pass(),  "empty dictionary passes universal constraint {hasTypeof: 'string'}");
                    a.ok(validateParams.validate([{a: 'b'}], [this.uniDictStrCons]).pass(),  "dictionary with one string value passes universal constraint {hasTypeof: 'string'}");
                    a.ok(validateParams.validate([{a: 'b', c: 'd'}], [this.uniDictStrCons]).pass(),  "dictionary with multiple string values passes universal constraint {hasTypeof: 'string'}");
                    a.notOk(validateParams.validate([{a: 42}], [this.uniDictStrCons]).pass(),  "dictionary with one number value fails universal constraint {hasTypeof: 'string'}");
                    a.notOk(validateParams.validate([{a: 42, b: 'c'}], [this.uniDictStrCons]).pass(),  "dictionary with one number and one string value fails universal constraint {hasTypeof: 'string'}");
                });
                
                QUnit.test('un-nested dictionary validation with only key-specific constraints', function(a){
                    a.expect(4);
                    a.ok(validateParams.validate([], [this.pkaDictStrCons]).pass(),  "undefined passes key-specifc constraints {a: {hasTypeof: 'string', presence: true}} (dictionary not required to be defined)");
                    a.notOk(validateParams.validate([{}], [this.pkaDictStrCons]).pass(),  "empty dictionary fails key-specifc constraints {a: {hasTypeof: 'string', presence: true}}");
                    a.ok(validateParams.validate([{a: 'b'}], [this.pkaDictStrCons]).pass(),  "dictionary {a: 'b'} passes key-specifc constraints {a: {hasTypeof: 'string', presence: true}}");
                    a.notOk(validateParams.validate([{a: 42}], [this.pkaDictStrCons]).pass(),  "dictionary {a: 42} fails key-specifc constraints {a: {hasTypeof: 'string', presence: true}}");
                });
                
                QUnit.test("un-nested dictionary validation with mix of key-specific and universal constraints that dont't overlap", function(a){
                    a.expect(7);
                    a.ok(validateParams.validate([], [this.ukncDictStrCons]).pass(),  "undefined passes unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true}} (dictionary not required to be defined)");
                    a.notOk(validateParams.validate([{}], [this.ukncDictStrCons]).pass(),  "empty dictionary fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true}}");
                    a.notOk(validateParams.validate([{c: 'd'}], [this.ukncDictStrCons]).pass(),  "dictionary {c: 'd'} fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true}}");
                    a.ok(validateParams.validate([{a: 'b'}], [this.ukncDictStrCons]).pass(),  "dictionary {a: 'b'} passes unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true}}");
                    a.ok(validateParams.validate([{a: 'b', c: 'd'}], [this.ukncDictStrCons]).pass(),  "dictionary {a: 'b', c: 'd'} passes unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true}}");
                    a.notOk(validateParams.validate([{a: 42, c: 'd'}], [this.ukncDictStrCons]).pass(),  "dictionary {a: 42, c: 'd'} fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true}}");
                    a.notOk(validateParams.validate([{a: 'b', c: 42}], [this.ukncDictStrCons]).pass(),  "dictionary {a: 'b', c: 42} fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true}}");
                });
                
                QUnit.test("un-nested dictionary validation with mix of key-specific and universal constraints that do overlap", function(a){
                    a.expect(7);
                    a.notOk(validateParams.validate([{}], [this.ukcDictStrCons]).pass(),  "empty dictionary fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true, hasTypeof: 'number'}}");
                    a.notOk(validateParams.validate([{c: 'd'}], [this.ukcDictStrCons]).pass(),  "dictionary {c: 'd'} fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true, hasTypeof: 'number'}}");
                    a.notOk(validateParams.validate([{a: 'b'}], [this.ukcDictStrCons]).pass(),  "dictionary {a: 'b'} fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true, hasTypeof: 'number'}}");
                    a.ok(validateParams.validate([{a: 42}], [this.ukcDictStrCons]).pass(),  "dictionary {a: 42} passes unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true, hasTypeof: 'number'}}");
                    a.notOk(validateParams.validate([{a: 'b', c: 'd'}], [this.ukcDictStrCons]).pass(),  "dictionary {a: 'b', c: 'd'} fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true, hasTypeof: 'number'}}");
                    a.ok(validateParams.validate([{a: 42, c: 'd'}], [this.ukcDictStrCons]).pass(),  "dictionary {a: 42, c: 'd'} passes unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true, hasTypeof: 'number'}}");
                    a.notOk(validateParams.validate([{a: 42, c: 42}], [this.ukcDictStrCons]).pass(),  "dictionary {a: 42, c: 42} fails unviversal constraint {hasTypeof: 'string'} and key-specific constraint {a: {presence: true, hasTypeof: 'number'}}");
                });
                
                QUnit.test('deep-nested dictionary validation', function(a){
                    a.expect(6);
                    a.ok(validateParams.validate([], [this.deepDictStrCons]).pass(),  "undefined passes deep-nested constraint {dictionary: {mapConstraints: {a: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.ok(validateParams.validate([{}], [this.deepDictStrCons]).pass(),  "empty object passes deep-nested constraint {dictionary: {mapConstraints: {a: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.notOk(validateParams.validate([{a: 'b'}], [this.deepDictStrCons]).pass(),  "{a: 'b'} fails deep-nested constraint {dictionary: {mapConstraints: {a: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.ok(validateParams.validate([{a: {}}], [this.deepDictStrCons]).pass(),  "{a: {}} passes deep-nested constraint {dictionary: {mapConstraints: {a: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.ok(validateParams.validate([{a: {b: 'c'}}], [this.deepDictStrCons]).pass(),  "{a: {b: 'c'}} passes deep-nested constraint {dictionary: {mapConstraints: {a: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.notOk(validateParams.validate([{a: {b: 42}}], [this.deepDictStrCons]).pass(),  "{a: {b: 42}} fails deep-nested constraint {dictionary: {mapConstraints: {a: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                });
                
                QUnit.test('un-nested list validation', function(a){
                    a.expect(6);
                    a.ok(validateParams.validate([], [this.listStrCons]).pass(),  "undefined passes value constraint {hasTypeof: 'string'} (list not required to be defined)");
                    a.ok(validateParams.validate([[]], [this.listStrCons]).pass(),  "empty list passes value constraint {hasTypeof: 'string'}");
                    a.ok(validateParams.validate([['a']], [this.listStrCons]).pass(),  "list of one string value passes value constraint {hasTypeof: 'string'}");
                    a.ok(validateParams.validate([['a', 'b']], [this.listStrCons]).pass(),  "list of multiple strings passes value constraint {hasTypeof: 'string'}");
                    a.notOk(validateParams.validate([[42]], [this.listStrCons]).pass(),  "list of one number fails value constraint {hasTypeof: 'string'}");
                    a.notOk(validateParams.validate([['a', 42]], [this.listStrCons]).pass(),  "list of one string and one number fails value constraint {hasTypeof: 'string'}");
                });
                
                QUnit.test('deep-nested list validation', function(a){
                    a.expect(6);
                    a.ok(validateParams.validate([], [this.deepListStrCons]).pass(),  "undefined passes deep-nested constraint {list: {valueConstraints: {list: {valueConstraints: {hasTypeof: 'string'}}}}}");
                    a.ok(validateParams.validate([[]], [this.deepListStrCons]).pass(),  "empty array passes deep-nested constraint {list: {valueConstraints: {list: {valueConstraints: {hasTypeof: 'string'}}}}}");
                    a.notOk(validateParams.validate([['a']], [this.deepListStrCons]).pass(),  "['a'] fails deep-nested constraint {list: {valueConstraints: {list: {valueConstraints: {hasTypeof: 'string'}}}}}");
                    a.ok(validateParams.validate([[[]]], [this.deepListStrCons]).pass(),  "array contianing empty array passes deep-nested constraint {list: {valueConstraints: {list: {valueConstraints: {hasTypeof: 'string'}}}}}");
                    a.ok(validateParams.validate([[['a'], ['b', 'c']]], [this.deepListStrCons]).pass(),  "[['a'], ['b', 'c']] passes deep-nested constraint {list: {valueConstraints: {list: {valueConstraints: {hasTypeof: 'string'}}}}}");
                    a.notOk(validateParams.validate([[['a'], ['b', 'c', 42]]], [this.deepListStrCons]).pass(),  "[['a'], ['b', 'c', 42]] fails deep-nested constraint {list: {valueConstraints: {list: {valueConstraints: {hasTypeof: 'string'}}}}}");
                });
            
                QUnit.test('deep-nested list and dictionary validation', function(a){
                    a.expect(6);
                    a.ok(validateParams.validate([], [this.deepNestedCons]).pass(),  "undefined passes deep-nested constraint {list: {valueConstraints: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.ok(validateParams.validate([[]], [this.deepNestedCons]).pass(),  "empty array passes deep-nested constraint {list: {valueConstraints: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.notOk(validateParams.validate([['a']], [this.deepNestedCons]).pass(),  "['a'] fails deep-nested constraint {list: {valueConstraints: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.ok(validateParams.validate([[{}]], [this.deepNestedCons]).pass(),  "array contianing empty plain object passes deep-nested constraint {list: {valueConstraints: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.ok(validateParams.validate([[{a: 'b'}, {c: 'd', e: 'f'}]], [this.deepNestedCons]).pass(),  "[{a: 'b'}, {c: 'd', e: 'f'}] passes deep-nested constraint {list: {valueConstraints: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                    a.notOk(validateParams.validate([[{a: 'b'}, {c: 'd', e: 42}]], [this.deepNestedCons]).pass(),  "[{a: 'b'}, {c: 'd', e: 42}] fails deep-nested constraint {list: {valueConstraints: {dictionary: {valueConstraints: { hasTypeof: 'string' }}}}}");
                });
            }    
        );
        
        QUnit.test('nested constraints', function(a){
            a.expect(1);
            var r = validateParams.validate(
                [{a: 'b'}],
                [{
                    defined: true,
                    dictionary: {valueConstraints: {hasTypeof: 'string'}}
                }]
            );
            a.ok(r.pass());
        });
    }
);

QUnit.module('validateParams.injectDefaults() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.injectDefaults, 'function');
    });
    
    QUnit.test('parameter number validation', function(a){
        a.expect(4);
        a.throws(
            function(){ validateParams.injectDefaults(); },
            Error,
            'first argument required'
        );
        a.throws(
            function(){ validateParams.injectDefaults([]); },
            Error,
            'second argument required'
        );
        a.ok((function(){ validateParams.injectDefaults([], []); return true; })(), 'third argument is not required');
        a.ok((function(){ validateParams.injectDefaults([], [], {}); return true; })(), 'third argument is allowed');
    });
    
    QUnit.test('params validation', function(a){
        var mustThrow = dummyBasicTypesExcept('arr');
        a.expect(mustThrow.length + 2);
            
        // make sure all the basic types excep array do indeed throw
        mustThrow.forEach(function(tn){
            a.throws(
                function(){ validateParams.injectDefaults(DUMMY_BASIC_TYPES[tn].val, []); },
                Error,
                'params not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
            );
        });
            
        // make sure an array does not throw
        a.ok((function(){ validateParams.injectDefaults([], []); return true; })(), 'params can be an array');
            
        // make sure an Arguments object does not throw
        a.ok((function(){ validateParams.injectDefaults(arguments, []); return true; })(), 'params can be an Arguments object');
    });
    
    QUnit.test('constraints validation', function(a){
        var mustThrow = dummyBasicTypesExcept('arr');
        a.expect(mustThrow.length + 1);
            
        // make sure all the basic types excep array do indeed throw
        mustThrow.forEach(function(tn){
            a.throws(
                function(){ validateParams.injectDefaults([], DUMMY_BASIC_TYPES[tn].val); },
                Error,
                'constraints not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
            );
        });
            
        // make sure an array does not throw
        a.ok((function(){ validateParams.injectDefaults([], []); return true; })(), 'constraints can be an array');
    });
    
    QUnit.test("the 'defaultWhenUndefined' per-parameter option", function(a){
        a.expect(11);
        var defaultObj = new Date();
        var defaultPlainObj = {a: 'b'};
        var defaultArr = ['a', 'b'];
        var defaultVal = 3.1415;
        var arrIn = [undefined, undefined, undefined, undefined, 42, '', {}, []];
        var arrOut = validateParams.injectDefaults(
            arrIn,
            [
                { vpopt_defaultWhenUndefined: defaultObj },
                { vpopt_defaultWhenUndefined: defaultPlainObj },
                { paramOptions: { defaultWhenUndefined: defaultArr } },
                { paramOptions: { defaultWhenUndefined: defaultVal } },
                { vpopt_defaultWhenUndefined: true },
                { vpopt_defaultWhenUndefined: true },
                { vpopt_defaultWhenUndefined: true },
                { vpopt_defaultWhenUndefined: true }
            ]
        );
        a.strictEqual(arrIn, arrOut, 'original parameter list returned');
        a.strictEqual(arrIn[0], defaultObj, 'undefined correctly defaulted to object reference');
        a.deepEqual(arrIn[1], defaultPlainObj, 'undefined correctly defaulted to plain object');
        a.notStrictEqual(arrIn[1], defaultPlainObj, 'defaulted value is copy of plain object');
        a.deepEqual(arrIn[2], defaultArr, 'undefined correctly defaulted to array');
        a.notStrictEqual(arrIn[2], defaultArr, 'defaulted value is copy of array');
        a.strictEqual(arrIn[3], defaultVal, 'undefined correctly defaulted to value');
        a.strictEqual(arrIn[4], 42, 'defined value un-changed');
        a.strictEqual(arrIn[5], '', 'empty string un-changed');
        a.deepEqual(arrIn[6], {}, 'empty plain object un-changed');
        a.deepEqual(arrIn[7], [], 'empty array un-changed');
    });
    
    QUnit.test("the 'defaultWhenEmpty' per-parameter option", function(a){
        a.expect(11);
        var defaultObj = new Date();
        var defaultPlainObj = {a: 'b'};
        var defaultArr = ['a', 'b'];
        var defaultVal = 3.1415;
        var arrIn = [undefined, undefined, undefined, undefined, 42, '', {}, []];
        var arrOut = validateParams.injectDefaults(
            arrIn,
            [
                { vpopt_defaultWhenEmpty: defaultObj },
                { vpopt_defaultWhenEmpty: defaultPlainObj },
                { paramOptions: { defaultWhenEmpty: defaultArr } },
                { paramOptions: { defaultWhenEmpty: defaultVal } },
                { vpopt_defaultWhenEmpty: true },
                { vpopt_defaultWhenEmpty: true },
                { vpopt_defaultWhenEmpty: true },
                { vpopt_defaultWhenEmpty: true }
            ]
        );
        a.strictEqual(arrIn, arrOut, 'original parameter list returned');
        a.strictEqual(arrIn[0], defaultObj, 'undefined correctly defaulted to object reference');
        a.deepEqual(arrIn[1], defaultPlainObj, 'undefined correctly defaulted to plain object');
        a.notStrictEqual(arrIn[1], defaultPlainObj, 'defaulted value is copy of plain object');
        a.deepEqual(arrIn[2], defaultArr, 'undefined correctly defaulted to array');
        a.notStrictEqual(arrIn[2], defaultArr, 'defaulted value is copy of array');
        a.strictEqual(arrIn[3], defaultVal, 'undefined correctly defaulted to value');
        a.strictEqual(arrIn[4], 42, 'defined non-empty value un-changed');
        a.strictEqual(arrIn[5], true, 'empty string correctly changed');
        a.strictEqual(arrIn[6], true, 'empty plain object correctly changed');
        a.strictEqual(arrIn[7], true, 'empty array correctly changed');
    });
    
    QUnit.test("the 'defaultWhenUndefined' option takes precedence over the 'defaultWhenEmpty' option", function(a){
        a.expect(1);
        var paramList = [];
        validateParams.injectDefaults(
            paramList,
            [{
                vpopt_defaultWhenUndefined: true,
                vpopt_defaultWhenEmpty: false
            }]
        );
        a.strictEqual(paramList[0], true);
    });
});

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
    
    QUnit.test('constraints validation', function(a){
        var mustThrow = dummyBasicTypesExcept('arr');
        a.expect(mustThrow.length + 1);
            
        // make sure all the basic types excep array do indeed throw
        mustThrow.forEach(function(tn){
            a.throws(
                function(){ validateParams.coerce([], DUMMY_BASIC_TYPES[tn].val); },
                Error,
                'constraints not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
            );
        });
            
        // make sure an array does not throw
        a.ok((function(){ validateParams.coerce([], []); return true; })(), 'constraints can be an array');
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
    
    QUnit.test('options.coerce:false ignored', function(a){
        var a1 = [5];
        validateParams.coerce(
            a1,
            [{
                vpopt_coerce: function(){
                    return 4;
                }
            }],
            {coerce: false}
        );
        a.equal(a1[0], 4);
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
    
    // test that the constructor constructs correctly
    QUnit.test('constructor correctly builds object', function(a){
        a.expect(8);
        var paramList = [ 'a' ];
        var consList = [ { presence: true } ];
        var options = {};
        var dummyAttrs = { param1: 'a' };
        var dummyCons = { param1: { presence: true } };
        var dummyErrorDetails = {};
        var dummyErrors = [];
        var r = new validateParams.Result(paramList, consList, options, dummyAttrs, dummyCons, dummyErrorDetails, dummyErrors);
        a.ok(r instanceof validateParams.Result, 'is instance of validateParams.Result');
        a.strictEqual(r._parameterList, paramList, 'parameter list stored correctly');
        a.strictEqual(r._constraintsList, consList, 'constraints list stored correctly');
        a.strictEqual(r._options, options, 'options stored correctly');
        a.strictEqual(r._validateAttributes, dummyAttrs, 'attributes object stored correctly');
        a.strictEqual(r._validateConstraints, dummyCons, 'constraints object stored correctly');
        a.strictEqual(r._errorDetails, dummyErrorDetails, 'error details stored correctly');
        a.strictEqual(r._errors, dummyErrors, 'errors stored correctly');
    });
    
    QUnit.test('constructor parameter validation', function(a){
        var mustThrowArray = dummyBasicTypesExcept('arr');
        var mustThrowObject = dummyBasicTypesExcept('obj', 'arr', 'fn');
        a.expect((mustThrowArray.length * 2) + (mustThrowObject.length * 3) + 2);
        
        var paramList = [ 'a' ];
        var consList = [ { presence: true } ];
        var dummyAttrs = { param1: 'a' };
        var dummyCons = { param1: { presence: true } };
        
        // make sure all valid values accept
        a.ok(
            new validateParams.Result(paramList, consList, {}, dummyAttrs, dummyCons),
            'valid values accepted for all parameters'
        );
        
        // make sure the array-like parameters throws appropraitely
        mustThrowArray.forEach(function(tn){
            var t = DUMMY_BASIC_TYPES[tn];
            a.throws(
                function(){
                    new validateParams.Result(t.val, consList, {}, dummyAttrs, dummyCons);
                },
                TypeError,
                "parameter list can't be " + t.desc
            );
            a.throws(
                function(){
                    new validateParams.Result(paramList, t.val, {}, dummyAttrs, dummyCons);
                },
                TypeError,
                "constraints list can't be " + t.desc
            );
        });
        a.ok(
            new validateParams.Result(arguments, consList, {}, dummyAttrs, dummyCons),
            'parameter list can be an Arguments object'
        );
        
        // make sure the object parameters throw appropraitely
        mustThrowObject.forEach(function(tn){
            var t = DUMMY_BASIC_TYPES[tn];
            a.throws(
                function(){
                    new validateParams.Result(paramList, consList, t.val, dummyAttrs, dummyCons);
                },
                TypeError,
                "options can't be " + t.desc
            );
            a.throws(
                function(){
                    new validateParams.Result(paramList, consList, {}, t.val, dummyCons);
                },
                TypeError,
                "attributes can't be " + t.desc
            );
            a.throws(
                function(){
                    new validateParams.Result(paramList, consList, {}, dummyAttrs, t.val);
                },
                TypeError,
                "constraints object can't be " + t.desc
            );
        });
    });
    
    QUnit.test('read-only accessors correctly access data', function(a){
        a.expect(6);
        var paramList = [42];
        var constraintsList = [{presence: true}, {presence: true}];
        var options = {format: 'flat'};
        var r = validateParams.validate(paramList, constraintsList, options);
        a.strictEqual(r.parameterList(), paramList, '.parameterList() returns correct referece');
        a.strictEqual(r.constraintsList(), constraintsList, '.constraintsList() returns correct referece');
        a.strictEqual(r.options(), options, '.options() returns correct referece');
        a.deepEqual(r.validateAttributes(), { param1: 42, param2: undefined }, '.validateAttributes() returns expected data structure');
        a.deepEqual(r.validateConstraints(), { param1: { presence: true }, param2: { presence: true } }, '.validateConstraints() returns expected data structure');
        a.deepEqual(r.errors(), [ "Param2 can't be blank" ], '.errors() returns expected value');
    });
    
    QUnit.test('.numErrors() method', function(a){
        a.expect(5);
        a.strictEqual(typeof validateParams.Result.prototype.numErrors, 'function', 'method exists');
        
        // create a constraints list to fail validations against
        var cl = [
            { defined: true },
            {
                presence: true,
                numericality: {
                    onlyInteger: true,
                    lessThan: 100
                },
            }
        ];
        
        // test without specifying an explicit format
        var r = validateParams.validate([undefined, 612.4], cl);
        a.equal(r.numErrors(), 2, 'unspecified format returns the correct count');
        
        // test format = flat
        r = validateParams.validate([undefined, 612.4], cl, {format: 'flat'});
        a.equal(r.numErrors(), 2, "format: 'flat' returns the correct count");
        
        // test format = grouped
        r = validateParams.validate([undefined, 612.4], cl, {format: 'grouped'});
        a.equal(r.numErrors(), 2, "format: 'grouped' returns the correct count");
        
        // test format = detailed
        r = validateParams.validate([undefined, 612.4], cl, {format: 'detailed'});
        a.equal(r.numErrors(), 2, "format: 'detailed' returns the correct count");
    });
    
    QUnit.test('.pass() method', function(a){
        a.expect(3);
        a.strictEqual(typeof validateParams.Result.prototype.pass, 'function', 'method exists');
        var cl = [{defined: true}];
        var r = validateParams.validate([true], cl);
        a.strictEqual(r.pass(), true, 'returns true on a successful validation');
        r = validateParams.validate([], cl);
        a.strictEqual(r.pass(), false, 'returns false on a failed validation');
    });
    
    QUnit.test('.passed() is an alias for .pass()', function(a){
        a.strictEqual(validateParams.Result.prototype.passed, validateParams.Result.prototype.pass);
    });
    
    QUnit.test('.fail() method', function(a){
        a.expect(3);
        a.strictEqual(typeof validateParams.Result.prototype.fail, 'function', 'method exists');
        var cl = [{defined: true}];
        var r = validateParams.validate([], cl);
        a.strictEqual(r.fail(), true, 'returns true on a failed validation');
        r = validateParams.validate([true], cl);
        a.strictEqual(r.fail(), false, 'returns false on a successful validation');
    });
    
    QUnit.test('.failed() is an alias for .fail()', function(a){
        a.strictEqual(validateParams.Result.prototype.failed, validateParams.Result.prototype.fail);
    });
    
    QUnit.test('.asString() returns expected values', function(a){
        a.expect(4);
        a.strictEqual(typeof validateParams.Result.prototype.asString, 'function', 'method exists');
        var cl = [{defined: true}, {defined: true}];
        var r = validateParams.validate([true, true], cl);
        a.strictEqual(r.asString(), 'passed', 'expected result on pass');
        r = validateParams.validate([true], cl);
        a.strictEqual(r.asString(), 'failed with 1 error', 'expected result on single error');
        r = validateParams.validate([], cl);
        a.strictEqual(r.asString(), 'failed with 2 errors', 'expected result on multiple errors');
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

// validateParams.shallowCopy
QUnit.module('validateParams.shallowCopy() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.shallowCopy, 'function');
    });
    
    QUnit.test('invalid data passed through', function(a){
        var mustPassUnaltered = dummyBasicTypesExcept('obj', 'arr');
        a.expect(mustPassUnaltered.length);
        mustPassUnaltered.forEach(function(tn){
            var t = DUMMY_BASIC_TYPES[tn];
            a.strictEqual(
                validateParams.shallowCopy(t.val),
                t.val,
                t.desc + ' passed un-altered'
            );
        });
    });
    
    QUnit.test('arrays shallow-coppied', function(a){
        a.expect(3);
        var origArr = [42, new Date()];
        var copyArr = validateParams.shallowCopy(origArr);
        a.notStrictEqual(origArr, copyArr, 'copy is not a reference to the original');
        a.strictEqual(origArr[0], copyArr[0], 'value coppied correctly');
        a.strictEqual(origArr[1], copyArr[1], 'reference coppied correctly');
    });
    
    QUnit.test('plain objects shallow-coppied', function(a){
        a.expect(3);
        var origObj = {a: 42, b: new Date()};
        var copyObj = validateParams.shallowCopy(origObj);
        a.notStrictEqual(origObj, copyObj, 'copy is not a reference to the original');
        a.strictEqual(origObj.a, copyObj.a, 'value coppied correctly');
        a.strictEqual(origObj.b, copyObj.b, 'reference coppied correctly');
    });
});

QUnit.module('validateParams.paramToAttrConstraints() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.paramToAttrConstraints, 'function');
    });
    
    QUnit.test('invalid data passed through', function(a){
        var mustPassUnaltered = dummyBasicTypesExcept('obj', 'arr');
        a.expect(mustPassUnaltered.length);
        mustPassUnaltered.forEach(function(tn){
            var t = DUMMY_BASIC_TYPES[tn];
            a.strictEqual(
                validateParams.paramToAttrConstraints(t.val),
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
        var filteredConstraint1 = validateParams.paramToAttrConstraints(testConstraint1);
        var filteredConstraint2 = validateParams.paramToAttrConstraints(testConstraint2);
        
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

QUnit.module('validateParams.isNumeric() function', {}, function(){
    QUnit.test('function exists', function(a){
        a.equal(typeof validateParams.isNumeric, 'function');
    });
    
    QUnit.test('function correctly detects numeric values', function(a){
        var mustReject = dummyBasicTypesExcept('num');
        var mustPass = [-42, -3.1415, 0, 3.1415, 42];
        mustReject.push('nan'); // NaN should also return false
        mustReject.push('str_empty'); // the empty string should also return false
        a.expect(mustReject.length + (mustPass.length * 2));
        
        // make sure the dumy data that should reject does
        mustReject.forEach(function(tn){
            var t = DUMMY_DATA[tn];
            a.equal(
                validateParams.isNumeric(t.val),
                false,
                t.desc + ' is not a plain object'
            );
        });
        
        // make sure numeric values pass as both numbers and strings
        mustPass.forEach(function(n){
            a.ok(validateParams.isNumeric(n), 'the number ' + n + ' is recognised as a number');
            var sn = String(n);
            a.ok(validateParams.isNumeric(sn), 'the string "' + sn + '" is recognised as a number');
        });
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

QUnit.module('validateParams.extendObject() function', {}, function(){
    QUnit.test('is an alias to validate.extend()', function(a){
        a.strictEqual(validateParams.extendObject, validate.extend);
    });
});

QUnit.module('private helper functions', {}, function(){
    QUnit.module('validateParams._extractCustomValidatorMessage()',
        {
            beforeEach: function(){
                this.fn = validateParams._extractCustomValidatorMessage; // for convenience
                this.dummyValidator = function(){ return undefined; };
            }
        },
        function(){
            QUnit.test('function exists', function(a){
                a.strictEqual(typeof validateParams._extractCustomValidatorMessage, 'function');
            });
        
            QUnit.test('fails gracefully with invalid arguments', function(a){
                a.expect(3);
                a.strictEqual(this.fn(), '', 'fails gracefully with no arguments');
                a.strictEqual(this.fn(42, {}), '', 'fails gracefully with invalid first argument');
                a.strictEqual(this.fn(this.dummyValidator, 42), '', 'fails gracefully with invalid second argument');
            });
            
            QUnit.test('correct precedence rules applied', function(a){
                a.expect(4);
                a.strictEqual(this.fn(this.dummyValidator, {}), '', 'when no messages are specified, empty string is returned');
                this.dummyValidator.options = {message: 'v.o.m'};
                a.strictEqual(this.fn(this.dummyValidator, {}), 'v.o.m', 'when only validator.options.message is specified, it is returned');
                this.dummyValidator.message = 'v.m';
                a.strictEqual(this.fn(this.dummyValidator, {}), 'v.m', 'validator.message takes precedence over validator.options.message');
                a.strictEqual(this.fn(this.dummyValidator, {message: 'o.m'}), 'o.m', 'options.message take precedence over validator.message & validator.options.message');
            });
    });
});

QUnit.module('custom validators', {}, function(){
    QUnit.module('defined', {}, function(){
        QUnit.test('validator exists', function(a){
            a.equal(typeof validateParams.validators.defined, 'function');
        });
        
        QUnit.test('{defined: true} and {defined: {rejectUndefined: true}}', function(a){
            var mustPass = dummyBasicTypesExcept('undef');
            a.expect((mustPass.length * 2) + 2);
            
            // make sure all types except undefined are accepted
            mustPass.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.notOk(validateParams([t.val], [{defined: true}]), t.desc + ' accepted as not undefined with {defined: true}');
                a.notOk(validateParams([t.val], [{defined: {rejectUndefined: true}}]), t.desc + ' accepted as not undefined with {defined: {rejectUndefined: true}}');
            });
            
            // make sure undefined rejects
            a.throws(
                function(){
                    validateParams.assert([undefined], [{defined: true}]);
                },
                validateParams.ValidationError,
                'undefined rejected with {defined: true}'
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [{defined: {rejectUndefined: true}}]);
                },
                validateParams.ValidationError,
                'undefined rejected with {defined: {rejectUndefined: true}}'
            );
        });
    });
    
    QUnit.module('hasTypeof', {}, function(){
        QUnit.test('validator exists', function(a){
            a.equal(typeof validateParams.validators.hasTypeof, 'function');
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
        
        QUnit.test("'inverseMatch' option", function(a){
            var mustPassSingle = dummyBasicTypesExcept('num');
            var mustPassMultiple = dummyBasicTypesExcept('num', 'str');
            a.expect(mustPassSingle.length + mustPassMultiple.length + 3);
            
            var singleInverseConstraint = {
                hasTypeof: {
                    types: ['number'],
                    inverseMatch: true
                }
            };
            var multipleInverseConstraint = {
                hasTypeof: {
                    types: ['number', 'string'],
                    inverseMatch: true
                }
            };
            
            
            // make sure everything works as expected when a single type is specified
            mustPassSingle.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.notOk(validateParams([t.val], [singleInverseConstraint]), t.desc + ' accepted as anything but a number');
            });
            a.throws(
                function(){
                    validateParams.assert([42], [singleInverseConstraint]);
                },
                validateParams.ValidationError,
                '42 rejeced as anything but a number'
            );
            
            // make sure everything works as expected when multiple types are specified
            mustPassMultiple.forEach(function(tn){
                var t = DUMMY_BASIC_TYPES[tn];
                a.notOk(validateParams([t.val], [multipleInverseConstraint]), t.desc + ' accepted as anything but a number or a string');
            });
            a.throws(
                function(){
                    validateParams.assert([42], [multipleInverseConstraint]);
                },
                validateParams.ValidationError,
                '42 rejeced as anything but a number or a string'
            );
            
            // make sure specifying undefined in the type list doesn't overvride the implicit acceptance of undefined
            a.notOk(
                validateParams([undefined], [{hasTypeof: {types: ['undefined', 'string'], inverseMatch: true}}]),
                'listing undefined in the type list while in inverted mode does not override the implicit acceptance of undefined'
            );
        });
    });
    
    QUnit.module('isInstanceof', {}, function(){
        QUnit.test('validator exists', function(a){
            a.equal(typeof validateParams.validators.isInstanceof, 'function');
        });
        
        QUnit.test('isInstanceof: true', function(a){
            var mustThrow = dummyBasicTypesExcept('obj', 'fn', 'arr', 'undef');
            a.expect(mustThrow.length + 2);
            
            // make sure non-object basic types reject
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
            
            // make sure undefined passes
            a.notOk(
                validateParams([undefined], [{isInstanceof: true}]),
                'undefined passed'
            );
            
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
        
         QUnit.test("'inverseMatch' option", function(a){
            a.expect(7);
            
            var singleInverseConstraint = {
                isInstanceof: {
                    prototypes: [Error],
                    inverseMatch: true
                }
            };
            var multiInverseConstraint = {
                isInstanceof: {
                    prototypes: [Error, Date],
                    inverseMatch: true
                }
            };
            
            // make sure everything works as expected when a single prototype is specified
            a.notOk(validateParams([new Date()], [singleInverseConstraint]), 'An instance of Date accepted as any object but an Error');
            a.throws(
                function(){
                    validateParams.assert([new Error()], [singleInverseConstraint]);
                },
                validateParams.ValidationError,
                'An instance of Error rejeced as any object but an Error'
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [singleInverseConstraint]);
                },
                validateParams.ValidationError,
                'An instance of TypeError rejeced as any object but an Error'
            );
            
            // make sure everything works as expected when two prototypes are specified
            a.notOk(validateParams([new RegExp()], [multiInverseConstraint]), 'An instance of RegExp accepted as any object but an Error or a Date');
            a.throws(
                function(){
                    validateParams.assert([new Error()], [multiInverseConstraint]);
                },
                validateParams.ValidationError,
                'An instance of Error rejeced as any object but an Error or a Date'
            );
            a.throws(
                function(){
                    validateParams.assert([new TypeError()], [multiInverseConstraint]);
                },
                validateParams.ValidationError,
                'An instance of TypeError rejeced as any object but an Error or a Date'
            );
            a.throws(
                function(){
                    validateParams.assert([new Date()], [multiInverseConstraint]);
                },
                validateParams.ValidationError,
                'An instance of Date rejeced as any object but an Error or a Date'
            );
        });
    });
    
    QUnit.module('dictionary', {}, function(){
        QUnit.test('validator exists', function(a){
            a.equal(typeof validateParams.validators.dictionary, 'function');
        });
        
        QUnit.test("'plainObjectOnly' option", function(a){
            a.expect(6);
            
            a.ok(validateParams.validate([{a: 'b'}], [{dictionary: {plainObjectOnly: false}}]).pass(), 'plain object accepted with plainObjectOnly=false');
            a.ok(validateParams.validate([arguments], [{dictionary: {plainObjectOnly: false}}]).pass(), 'arguments object accepted with plainObjectOnly=false');
            a.ok(validateParams.validate([new Date()], [{dictionary: {plainObjectOnly: false}}]).pass(), 'instance of Date accepted with plainObjectOnly=false');
            a.ok(validateParams.validate([{a: 'b'}], [{dictionary: {plainObjectOnly: true}}]).pass(), 'plain object accepted with plainObjectOnly=true');
            a.notOk(validateParams.validate([arguments], [{dictionary: {plainObjectOnly: true}}]).pass(), 'arguments object rejected with plainObjectOnly=true');
            a.notOk(validateParams.validate([new Date()], [{dictionary: {plainObjectOnly: true}}]).pass(), 'instance of Date rejected with plainObjectOnly=true');
        });
        
        QUnit.test("'keyConstraints' option", function(a){
            a.expect(4);
            
            var keyCons = {
                dictionary: {
                    keyConstraints: { length: { is: 2 } }
                }
            };
            a.ok(validateParams.validate([{}], [keyCons]).pass(), 'empty object passes key constraint {length: {is: 2}}');
            a.ok(validateParams.validate([{ab: 'c'}], [keyCons]).pass(), "{ab: 'c'} passes key constraint {length: {is: 2}}");
            a.ok(validateParams.validate([{ab: 'c', de: 42}], [keyCons]).pass(), "{ab: 'c', de: 42} passes key constraint {length: {is: 2}}");
            a.equal(validateParams.validate([{abc: 'd', e: 42}], [keyCons]).numErrors(), 2, "{abc: 'd', e: 42} fails key constraint {length: {is: 2}} with 2 errors");
        });
        
        QUnit.test("'rejectUnspecifiedKeys' option", function(a){
            a.expect(4);
            
            a.ok(validateParams.validate([{a: 'b'}], [{dictionary: {rejectUnspecifiedKeys: false}}]).pass(), 'plain object accepted with rejectUnspecifiedKeys=false and no specified keys');
            a.ok(validateParams.validate([{a: 'b'}], [{dictionary: {rejectUnspecifiedKeys: false, mapConstraints: {a: {defined: true}}}}]).pass(), "plain object with key 'a' accepted with rejectUnspecifiedKeys=false and specified key 'a'");
            a.ok(validateParams.validate([{a: 'b'}], [{dictionary: {rejectUnspecifiedKeys: true, mapConstraints: {a: {defined: true}}}}]).pass(), "plain object with key 'a' accepted with rejectUnspecifiedKeys=true and specified key 'a'");
            a.notOk(validateParams.validate([{a: 'b', c: 'd'}], [{dictionary: {rejectUnspecifiedKeys: true, mapConstraints: {a: {defined: true}}}}]).pass(), "plain object with keys 'a' & 'd' rejected with rejectUnspecifiedKeys=true and specified key 'a'");
        });
        
        QUnit.test("'sizeIs' option", function(a){
            a.expect(4);
            
            a.notOk(validateParams.validate([{}], [{dictionary: {sizeIs: 2}}]).pass(), 'empty object rejected with sizeIs=2');
            a.notOk(validateParams.validate([{a: 'b'}], [{dictionary: {sizeIs: 2}}]).pass(), "{a: 'b'} rejected with sizeIs=2");
            a.ok(validateParams.validate([{a: 'b', c: 'd'}], [{dictionary: {sizeIs: 2}}]).pass(), "{a: 'b', c: 'd'} accepted with sizeIs=2");
            a.notOk(validateParams.validate([{a: 'b', c: 'd', e: 'f'}], [{dictionary: {sizeIs: 2}}]).pass(), "{a: 'b', c: 'd', e: 'f'} rejected with sizeIs=2");
        });
        
        QUnit.test("'minimumSize' option", function(a){
            a.expect(4);
            
            a.notOk(validateParams.validate([{}], [{dictionary: {minimumSize: 2}}]).pass(), 'empty object rejected with minimumSize=2');
            a.notOk(validateParams.validate([{a: 'b'}], [{dictionary: {minimumSize: 2}}]).pass(), "{a: 'b'} rejected with minimumSize=2");
            a.ok(validateParams.validate([{a: 'b', c: 'd'}], [{dictionary: {minimumSize: 2}}]).pass(), "{a: 'b', c: 'd'} accepted with minimumSize=2");
            a.ok(validateParams.validate([{a: 'b', c: 'd', e: 'f'}], [{dictionary: {minimumSize: 2}}]).pass(), "{a: 'b', c: 'd', e: 'f'} accepted with minimumSize=2");
        });
        
        QUnit.test("'maximumSize' option", function(a){
            a.expect(4);
            
            a.ok(validateParams.validate([{}], [{dictionary: {maximumSize: 2}}]).pass(), 'empty object accepted with maximumSize=2');
            a.ok(validateParams.validate([{a: 'b'}], [{dictionary: {maximumSize: 2}}]).pass(), "{a: 'b'} accepted with maximumSize=2");
            a.ok(validateParams.validate([{a: 'b', c: 'd'}], [{dictionary: {maximumSize: 2}}]).pass(), "{a: 'b', c: 'd'} accepted with maximumSize=2");
            a.notOk(validateParams.validate([{a: 'b', c: 'd', e: 'f'}], [{dictionary: {maximumSize: 2}}]).pass(), "{a: 'b', c: 'd', e: 'f'} rejected with maximumSize=2");
        });
    });
    
    QUnit.module('list', {}, function(){
        QUnit.test('validator exists', function(a){
            a.equal(typeof validateParams.validators.list, 'function');
        });
        
        QUnit.test("'arrayOnly' option", function(a){
            a.expect(4);
            
            a.ok(validateParams.validate([[]], [{list: {arrayOnly: false}}]).pass(), 'empty array accepted with arrayOnly=false');
            a.ok(validateParams.validate([arguments], [{list: {arrayOnly: false}}]).pass(), 'arguments object accepted with arrayOnly=false');
            a.ok(validateParams.validate([['a', 'b']], [{list: {arrayOnly: true}}]).pass(), 'array literal with two elements accepted with arrayOnly=true');
            a.notOk(validateParams.validate([arguments], [{list: {arrayOnly: true}}]).pass(), 'arguments object rejected with arrayOnly=true');
        });
        
        QUnit.test("'lengthIs' option", function(a){
            a.expect(4);
            
            a.notOk(validateParams.validate([[]], [{list: {lengthIs: 2}}]).pass(), 'empty array rejected with lengthIs=2');
            a.notOk(validateParams.validate([['a']], [{list: {lengthIs: 2}}]).pass(), "['a'] rejected with lengthIs=2");
            a.ok(validateParams.validate([['a', 'b']], [{list: {lengthIs: 2}}]).pass(), "['a', 'b'] accepted with lengthIs=2");
            a.notOk(validateParams.validate([['a', 'b', 'c']], [{list: {lengthIs: 2}}]).pass(), "['a', 'b', 'c'] rejected with lengthIs=2");
        });
        
        QUnit.test("'minimumLength' option", function(a){
            a.expect(4);
            
            a.notOk(validateParams.validate([[]], [{list: {minimumLength: 2}}]).pass(), 'empty array rejected with minimumLength=2');
            a.notOk(validateParams.validate([['a']], [{list: {minimumLength: 2}}]).pass(), "['a'] rejected with minimumLength=2");
            a.ok(validateParams.validate([['a', 'b']], [{list: {minimumLength: 2}}]).pass(), "['a', 'b'] accepted with minimumLength=2");
            a.ok(validateParams.validate([['a', 'b', 'c']], [{list: {minimumLength: 2}}]).pass(), "['a', 'b', 'c'] accepted with minimumLength=2");
        });
        
        QUnit.test("'maximumLength' option", function(a){
            a.expect(4);
            
            a.ok(validateParams.validate([[]], [{list: {maximumLength: 2}}]).pass(), 'empty array accepted with maximumLength=2');
            a.ok(validateParams.validate([['a']], [{list: {maximumLength: 2}}]).pass(), "['a'] accepted with maximumLength=2");
            a.ok(validateParams.validate([['a', 'b']], [{list: {maximumLength: 2}}]).pass(), "['a', 'b'] accepted with maximumLength=2");
            a.notOk(validateParams.validate([['a', 'b', 'c']], [{list: {maximumLength: 2}}]).pass(), "['a', 'b', 'c'] rejected with maximumLength=2");
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