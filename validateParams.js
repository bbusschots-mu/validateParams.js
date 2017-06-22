/**
 * A wrapper around validate.js designed to facilitate its use for validation
 * function parameters rather than web forms.
 *
 * The module is provided as a function, `validateParams()`, which contains
 * further helper functions as attributes.
 * 
 * @module validateParams
 */

/**
 * @namespace validateParams
 * @variation 2
 */

// if we're not in a Node environment, and validate does not exist, throw an error
if(typeof require !== 'function' && typeof require !== 'function'){
    throw new Error('valdiate.js is a prerequisite of validateParams.js, but has not been loaded');
}

// If we are in a Node environment, require validate.js
var validate = typeof validate !== 'undefined' ? validate : require('validate.js');

//
//=== The Main Function ========================================================
//

/**
 * A function for validating the parameters to a function.
 *
 * This is a wrapper around validate.js. Each parameter is validated using
 * `validate.single()`, and an Error is thrown if the arguments do not pass
 * validation.
 *
 * @variation 3
 * @param {Arguments|Array} params - an array-like object representing the
 * parameters to be validated, usually an `Arguments` object.
 * @param {Array} constraints - an array of constraint objects as expected
 * by `validate.single()`, one for each parameter to be validated.
 * @param {Object} [options] - a plain object to be passed as the `options`
 * parameter to `validate.single()`.
 * @returns {boolean} always returns true.
 * @throws {Error} throws an error on invalid arguments.
 */
var validateParams = function(params, constraints, options){
    // validate parameters
    if(!(params && (validate.isArray(params) || validateParams.isArguments(params)))){
        throw new Error('first parameter must be an array of parameters to test, or an Arguments object');
    }
    if(!validate.isArray(constraints)){
        throw new Error('second parameter must be an array of constraints to test against');
    }
    if(typeof options !== 'undefined' && !(validate.isObject(options) && !validate.isArray(options))){
        throw new Error('if present, the third parameter must be a plain object');
    }
    
    // loop through each parameter and validate it
    var errors = [];
    for(var i = 0; i < params.length; i++){
        var human = i + 1;
        if(typeof constraints[i] === 'object'){
            var paramErrors = validate.single(params[i], constraints[i], typeof options === 'object' ? options : {});
            if(paramErrors){
                errors.concat(paramErrors);
            }
        }else{
            validateParams._warn('no constraints ' + human + ' parameter - assumed pass');
        }
    }
};

//
//=== Public Utility Functions =================================================
//

/**
 * A function to test if a given item is an Arguments object.
 *
 * This implementation is based on
 * [this answer on Stack Overflow]{@link https://stackoverflow.com/a/29924715/174985}.
 *
 * @memberof validateParams(2)
 * @param item - the item to test.
 * @returns {boolean} - true if the item is an Arguments object, false
 * otherwise.
 *
 * @example
 * validateParams.isArguments(['stuff', 'thingys']); // false
 * function x(){
 *     validateParams.isArguments(arguments); // true
 * }
 */
validateParams.isArguments = function(item){
    return Object.prototype.toString.call( item ) === '[object Arguments]';
};

/**
 * A helper function for converting an integer to an ordinal (e.g. 1 to 1st).
 *
 * The parameter will be run through `parseInt()` to force it to an integer.
 *
 * @memberof validateParams(2)
 * @param {number} n - the integer number to be converted to an ordinal
 * @returns {string}
 */
validateParams.asOrdinal = function(n){
    n = parseInt(n); // force n to an integer
    
    var lastDigit = String(n).slice(-1);
    var teenEnding = String(n).match(/1[123]$/);
    if(lastDigit == 1 && !teenEnding){
        return n + 'st';
    }else if(lastDigit == 2 && !teenEnding){
        return n + 'nd';
    }else if(lastDigit == 3 && !teenEnding){
        return n + 'rd';
    }
    return n + 'th';
}

//
//=== 'Private' Helper Functions ===============================================
//

/**
 * A helper function for printing a warning to the console.
 *
 * @memberof validateParams(2)
 * @private
 * @param {string} msg - the warning message to log.
 */
validateParams._warn = function(msg){
    if(typeof console !== "undefined"){
        if(console.warn){
            console.warn("[validateParams.js] " + msg);
        }else{
            console.log("[validateParams.js - WARNING] " + msg);
        }
    }
};

// If we're in a Node environment, export the function
if(module){
    module.exports = validateParams;
}