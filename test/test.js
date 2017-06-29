//
// === Setup and other Prep Work ===============================================
//

// import the module under test
var validateParams = require('../');

// import validate.js
var validate = require('validate.js');

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

QUnit.module('validateParams() function',
    {
        beforeEach: function(){
            this.dummyFn = function(){
                var errors = validateParams(arguments, [
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
                if(errors){
                    throw new Error();
                }
            };
        }
    },
    function(){
        QUnit.test('function exists', function(a){
            a.equal(typeof validateParams, 'function');
        });
        
        QUnit.test('parameter number validation', function(a){
            a.expect(4);
            a.throws(
                function(){ validateParams(); },
                Error,
                'first argument required'
            );
            a.throws(
                function(){ validateParams([]); },
                Error,
                'second argument required'
            );
            a.ok((function(){ validateParams([], []); return true; })(), 'third argument is not required');
            a.ok((function(){ validateParams([], [], {}); return true; })(), 'third argument is allowed');
        });
        
        QUnit.test('params validation', function(a){
            var mustThrow = dummyBasicTypesExcept('arr');
            a.expect(mustThrow.length + 2);
            
            // make sure all the basic types excep array do indeed throw
            mustThrow.forEach(function(tn){
                a.throws(
                    function(){ validateParams(DUMMY_BASIC_TYPES[tn].val, []); },
                    Error,
                    'params not allowed to be ' + DUMMY_BASIC_TYPES[tn].desc
                );
            });
            
            // make sure an array does not throw
            a.ok((function(){ validateParams([], []); return true; })(), 'params can be an array');
            
            // make sure an Arguments object does not throw
            a.ok((function(){ validateParams(arguments, []); return true; })(), 'params can be an Arguments object');
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
                validateParams(arguments,
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
                    validateParams.assert([t.val], [{hasTypeof: true}]),
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
        
        QUnit.test("'invert', 'notEqual' & 'not' options", function(a){
            var mustPassSingle = dummyBasicTypesExcept('num');
            var mustPassMultiple = dummyBasicTypesExcept('num', 'str');
            a.expect((mustPassSingle.length * 3) + (mustPassMultiple.length * 3) + 7);
            
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
        
        QUnit.test("'enforcePresence', 'presence' & 'require' options", function(a){
            a.expect(12);
            
            // test the un-inverted use-case
            var enforcePresenceContraint = {
                hasTypeof: {
                    type: 'number',
                    enforcePresence: true
                }
            };
            var presenceContraint = {
                hasTypeof: {
                    type: 'number',
                    presence: true
                }
            };
            var requireContraint = {
                hasTypeof: {
                    type: 'number',
                    require: true
                }
            };
            a.throws(
                function(){
                    validateParams.assert([undefined], [enforcePresenceContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'enforcePresence' option on type number"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [presenceContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'presence' option on type number"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [requireContraint]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'require' option on type number"
            );
            a.notOk(validateParams([42], [enforcePresenceContraint]), "42 accepted with 'enforcePresence' option on type number");
            a.notOk(validateParams([42], [presenceContraint]), "42 accepted with 'presence' option on type number");
            a.notOk(validateParams([42], [requireContraint]), "42 accepted with 'require' option on type number");
            
            // test the inverted use-case
            var enforcePresenceContraintInverted = {
                hasTypeof: {
                    type: 'number',
                    invert: true,
                    enforcePresence: true
                }
            };
            var presenceContraintInverted = {
                hasTypeof: {
                    type: 'number',
                    invert: true,
                    presence: true
                }
            };
            var requireContraintInverted = {
                hasTypeof: {
                    type: 'number',
                    invert: true,
                    require: true
                }
            };
            a.throws(
                function(){
                    validateParams.assert([undefined], [enforcePresenceContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'enforcePresence' option on type anything but number"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [presenceContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'presence' option on type anything but number"
            );
            a.throws(
                function(){
                    validateParams.assert([undefined], [requireContraintInverted]);
                },
                validateParams.ValidationError,
                "undefined rejected with 'require' option on type anything but number"
            );
            a.notOk(validateParams(['stuff'], [enforcePresenceContraintInverted]), "'stuff' accepted with 'enforcePresence' option on type anything but number");
            a.notOk(validateParams(['stuff'], [presenceContraintInverted]), "'stuff' accepted with 'presence' option on type anything but number");
            a.notOk(validateParams(['stuff'], [requireContraintInverted]), "'stuff' accepted with 'require' option on type anything but number");
        });
    });
});