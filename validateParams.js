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
 * This is a wrapper around the `validate()` function from
 * [validate.js]{@link https://validatejs.org/#validate}. Both the values to be
 * tested and the constraints they should be tested against are specified using
 * arrays (or array-like objects) rather than associative arrays as expected by
 * `validate()`. The function assembles the specified values and constraints
 * into associative arrays using the variable names `param1`, `param2` etc..
 *
 * @variation 3
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
 * @returns {boolean|string[]} if there were no errors, false is returned,
 * otherwise, an array of error strings is returned.
 * @throws {Error} throws an error on invalid arguments.
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
    
    // return the errors
    return errors;
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