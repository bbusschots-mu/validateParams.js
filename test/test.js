//
// === Setup and other Prep Work ===============================================
//

// import the module under test
var validateParams = require('../');

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
// === Test the main Function ==================================================
//

QUnit.module('validateParams() function', {}, function(){
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