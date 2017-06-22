// if we're not in a Node environment, and validate does not exist, throw an error
if(typeof require !== 'function' && typeof require !== 'function'){
    throw new Error('valdiate.js is a prerequisite of validateParams.js, but has not been loaded');
}

// If we are in a Node environment, require validate.js
var validate = typeof validate !== 'undefined' ? validate : require('validate.js');

/**
 * A function for validating the parameters to a function.
 *
 * This is a wrapper around validate.js. Each parameter is validated using
 * `validate.single()`, and an Error is thrown if the arguments do not pass
 * validation.
 *
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
};

/**
 * A function to test if a given item is an Arguments object.
 *
 * This implementation is based on
 * [this answer on Stack Overflow]{@link https://stackoverflow.com/a/29924715/174985}.
 *
 * @param item - the item to test.
 * @returns {boolean} - true if the item is an Arguments object, false
 * otherwise.
 */
validateParams.isArguments = function(item){
    return Object.prototype.toString.call( item ) === '[object Arguments]';
};

// If we're in a Node environment, export the function
if(module){
    module.exports = validateParams;
}