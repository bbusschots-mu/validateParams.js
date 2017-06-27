/**
 * @file Provides the [validateParams]{@link module:validateParams} module.
 * @version 0.0.1
 * @author Bart Busschots bart.busschots@mu.ie
 * @license MIT
 * @see https://github.com/bbusschots-mu/validateParams.js
 */

/**
 * The `validate()` function from [validate.js]{@link http://validatejs.org/}.
 * @external validate
 * @see {@link https://validatejs.org/#validate}
 */

/**
 * A wrapper around [validate.js]{@link http://validatejs.org/} designed to
 * facilitate its use for function parameter validation.
 *
 * This module exports its functionality as a single function which contains
 * further helper functions as properties. This is the same design pattern as
 * validate.js.
 * 
 * @module validateParams
 * @requires module:validate.js
 */

// if we're not in a Node environment, and validate does not exist, throw an error
if(typeof require !== 'function' && typeof require !== 'function'){
    throw new Error('valdiate.js is a prerequisite of validateParams.js, but has not been loaded');
}

// If we are in a Node environment, require validate.js
var validate = typeof validate !== 'undefined' ? validate : require('validate.js');

//
//=== The Main Function (and shortcut wrapper) =================================
//

/**
 * A function for validating the parameters to a function.
 *
 * This is a wrapper around the [validate()]{@link external:validate} function
 * from [validate.js]{@link https://validatejs.org/#validate}. Both the values
 * to be tested and the constraints they should be tested against are specified
 * using arrays (or array-like objects) rather than associative arrays as
 * expected by [validate()]{@link external:validate}. The function assembles the
 * specified values and constraints into associative arrays using the names
 * `param1`, `param2` etc..
 *
 * @alias valiateParams
 * @param {Arguments|Array} params - an array-like object representing the
 * parameters to be validated, usually an `Arguments` object.
 * @param {Array} constraints - an array of constraint objects as expected
 * by `validate.single()`, one for each parameter to be validated.
 * @param {Object} [options] - an associative array of options.
 * @param {string} [options.format='grouped'] - the format in which to return
 * any error messages found. For details see the
 * [Format section of the validate.js docs]{@link https://validatejs.org/#validate-error-formatting}.
 * @param {boolean} [options.fullMessages=true] - whether or not to pre-fix
 * error messages with the variable name (`param1` etc.).
 * @param {boolean} [options.fatal=false] - whether or not to throw a
 * {@link validateParams.ValidationError} when there is a validation error
 * rather than returning the error messages.
 * @returns {boolean|string[]} if there were no errors, false is returned,
 * otherwise, an array of error strings is returned.
 * @throws {Error} throws an error on invalid arguments.
 * @throws {validateParams.ValidationError} throws a validation error if the
 * parameters fail to validate and `options.fatal=true`.
 * @see external:validate
 * @example
 * function repeatString(s, n){
 *     var errors = validateParams(arguments, [
 *         {
 *             presence: true
 *             
 *         },
 *         {
 *             presence: true,
 *             numericality: {
 *                 onlyInteger: true,
 *                 greaterThan: 0
 *             }
 *         }
 *     ]);
 *     if(errors){
 *         throw new Error('invalid args!');
 *     }
 *     var ans = '';
 *     for(var i = 0; i < n; i++){
 *         ans += String(s);
 *     }
 *     return ans;
 * }
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
    
    // figure out whether or not we're in fatal mode
    var doThrow = false;
    if(typeof options === 'object'){
        if(options.fatal){
            doThrow = true;
        }
        if(typeof options.fatal !== 'undefined'){
            delete options.fatal; // don't want to pass this key on to validate()
        }
    }
    
    // build the values and constraints objects
    var valdiateAttributes = {};
    var validateConstraints = {};
    for(var i = 0; i < constraints.length; i++){
        var paramName = 'param' + (i + 1);
        valdiateAttributes[paramName] = params[i];
        validateConstraints[paramName] = validate.isObject(constraints[i]) ? constraints[i] : {};
    }
    
    // do the validation
    var errors = validate(valdiateAttributes, validateConstraints, options);
    
    // throw an error if we need to
    if(doThrow && errors){
        throw new validateParams.ValidationError('parameter validation failed with the following errors:\n' + JSON.stringify(errors), errors);
    }
    
    // return the errors
    return errors;
};

/**
 * A wrapper for the exported function (`validateParams()`) that
 * passes all arguments through, but sets `options.fatal` to true, ensuring
 * validations errors trigger the throwing of a
 * {@link validateParams.ValidationError} error.
 *
 * @alias module:validateParams.assert
 * @throws {validateParams.ValidationError}
 * @example
 * function repeatString(s, n){
 *     validateParams.assert(arguments, [
 *         {
 *             presence: true
 *             
 *         },
 *         {
 *             presence: true,
 *             numericality: {
 *                 onlyInteger: true,
 *                 greaterThan: 0
 *             }
 *         }
 *     ]);
 *     var ans = '';
 *     for(var i = 0; i < n; i++){
 *         ans += String(s);
 *     }
 *     return ans;
 * }
 */
validateParams.assert = function(params, constraints, options){
    if(typeof options !== 'object'){
        options = {};
    }
    options.fatal = true;
    validateParams(params, constraints, options);
};

//
//=== Custom Validation Error Prototype ========================================
//

/**
 * A custom error prototype for validaiton errors.
 * 
 * @constructor
 * @alias module:validateParams.ValidationError
 * @param {string} msg - an error message.
 * @param {array|object} errors - the error messages as returned by `validate()`.
 * @see {@link https://stackoverflow.com/a/17891099/174985|Based on this StackOverflow answer}
 */
validateParams.ValidationError = function(msg, errors){
    /**
     * The error name.
     * `validateParams.ValidationError`.
     * @type {string}
     * @default
     */
    this.name = "validateParams.ValidationError";
    
    /**
     * The error message.
     * @type {string}
     */
    this.message = typeof msg === 'string' ? msg : '';
    
    /**
     * The validation errors. This value should be populated by the
     * `validateParams()` function, and its exact contents will vary depending
     * on the value of `options.format` passed to `validateParams()`.
     * @type {boolean|array|object}
     * @default false
     */
    this.validationErrors = false;
    if(typeof errors === 'object'){
        this.validationErrors = errors;
    }
};
validateParams.ValidationError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: validateParams.ValidationError,
        writable: true,
        configurable: true
    }
});

//
//=== Public Utility Functions =================================================
//

/**
 * A function to test if a given item is an Arguments object.
 *
 * This implementation is based on
 * [this answer on Stack Overflow]{@link https://stackoverflow.com/a/29924715/174985}.
 *
 * @alias module:validateParams.isArguments
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
 * @alias module:validateParams.asOrdinal
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
 * @alias module:validateParams._warn
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