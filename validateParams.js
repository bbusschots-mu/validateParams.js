/**
 * @file Provides the [validateParams]{@link module:validateParams} module.
 * @version 1.1.1
 * @author Bart Busschots <bart.busschots@mu.ie>
 * @license MIT
 * @see https://github.com/bbusschots-mu/validateParams.js
 */

/**
 * The `validate()` function from [validate.js]{@link http://validatejs.org/}.
 * @external validate
 * @see {@link https://validatejs.org/#validate}
 */

/**
 * The `isEmpty()` function from [validate.js]{@link http://validatejs.org/}.
 * @external isEmpty
 * @see {@link https://validatejs.org/#utilities-is-empty}
 */

/**
 * The `isObject()` function from [validate.js]{@link http://validatejs.org/}.
 * @external isObject
 * @see {@link https://validatejs.org/#utilities-is-object}
 */

/**
 * A validate.js validator.
 * @typedef {function} Validator
 * @see {@link https://validatejs.org/#custom-validator}
 */

/**
 * A plain object containing validator settings indexed by validator names.
 * @typedef {Object} ValidateConstraints
 * @example
 * {
 *     presence: true;
 *     url: {
 *         schemes: ['http', 'https'],
 *         allowLocal: true
 *     }
 * }
 */

/**
 * A plain object contaning a mix of validator and meta-validator settings
 * indexed by name.
 * @typedef {Object} ValidateParamsConstraints
 * @example
 * {
 *     presence: true;
 *     url: {
 *         schemes: ['http', 'https'],
 *         allowLocal: true
 *     },
 *     meta_coerce: function(v){
 *         return typeof v === 'string' && !v.match(/\/$/) ? v + '/' : v;
 *     }
 * }
 */

/**
 * A validation callback for use with the `meta_coerce` meta-validation.
 * @callback CoercionCallback
 * @param {*} value - the value to be coerced.
 * @returns {*} The coerced value.
 */

/**
 * A wrapper around [validate.js]{@link http://validatejs.org/} designed to
 * facilitate its use for function parameter validation.
 *
 * As well as facilitating easier to access to the validation provided by
 * validate.js, this module also adds some extra features including some
 * [custom validators]{@link module:validateParams.validators}, and
 * support for coercion.
 *
 * This module exports its functionality as a single main function,
 * `validateParams()`, which contains further helper functions as properties.
 * This is the same design pattern used for validate.js.
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

// If we are in a Node environment, require humanJoin.js, and always configure it
var humanJoin = typeof humanJoin !== 'undefined' ? humanJoin : require('@maynoothuniversity/human-join');
humanJoin.optionDefaults.quoteWith = "'";
humanJoin.optionDefaults.conjunction = ", or ";

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
 * ##### Meta-Validators
 *
 * Meta-validators are used to add extra functionality to this function which is
 * not available in the validate.js module.
 * 
 * Any validator name starting with `meta_` in any of the constraint objects
 * will be interpreted as a meta-validator, and will be stripped out before
 * being passed to [validate()]{@link external:validate}.
 *
 * ##### Coercions
 *
 * A coercion is a function that tries to make the value of a parameter valid
 * before the constraints are applied. Coercions alter the values stored in the
 * parameters list, so the updated value will be available for use after
 * validation.
 *
 * Coercions are implemented using the meta-validator `meta_coercion`. The value
 * for assigned to this name in a constraint should be a
 * [coercion callback]{@link CoercionCallback}. If present, that callback will
 * be invoked with the value to be coerced as the first parameter, and the
 * callback should return an altered value or the original value.
 *
 * @alias valiateParams
 * @param {(Arguments|Array)} params - an array-like object representing the
 * parameters to be validated, usually an `Arguments` object.
 * @param {ValidateParamsConstraints[]} constraints - an array of
 * constraint objects which can contain both validator data as expected by
 * `validate.single()` and meta-validator data as supported by this function.
 * The constraints defined in the first element of this array will be applied
 * to the first parameter, the constraints in the second element to the second
 * parameter and so-on.
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
 * // basic example - 2 required parameters
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
 *
 * // example with a coercion
 * function getAPIURL(baseURL){
 *     var errors = validateParams(arguments, [{
 *         presence: true,
 *         url: {
 *             schemes: ['http', 'https'],
 *             allowLocal: true
 *         },
 *         meta_coerce: function(v){
 *            // append a trailing / if needed
 *            return typeof v === 'string' && !v.match(/\/$/) ? v + '/' : v;
 *         }
 *     }]);
 *     if(errors){
 *         throw new Error('invalid args!');
 *     }
 *     return baseURL + 'api.php';
 * }
 * 
 */
var validateParams = function(params, constraints, options){
    return validateParams.apply(params, constraints, options).errors();
};

/**
 * The function that does the actual work.
 * 
 * @returns {validateParams.Result}
 * @since version 1.1.1
 */
validateParams.apply = function(params, constraints, options){
    // counter for use in loops
    var i;
    
    // validate parameters
    if(!(params && (validate.isArray(params) || validateParams.isArguments(params)))){
        throw new Error('first parameter must be an array of parameters to test, or an Arguments object');
    }
    if(!validate.isArray(constraints)){
        throw new Error('second parameter must be an array of constraints to test against');
    }
    if(typeof options !== 'undefined' && !validateParams.isPlainObject(options)){
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
    
    // apply any defined coercions
    validateParams.coerce(params, constraints, options);
    
    // build the values and constraints objects
    var valdiateAttributes = {};
    var validateConstraints = {};
    for(i = 0; i < constraints.length; i++){
        var paramName = 'param' + (i + 1);
        valdiateAttributes[paramName] = params[i];
        validateConstraints[paramName] = validate.isObject(constraints[i]) ? validateParams.filterMetaValidators(constraints[i]) : {};
    }
    
    // do the validation
    var errors = validate(valdiateAttributes, validateConstraints, options);
    
    // throw an error if we need to
    if(doThrow && errors){
        throw new validateParams.ValidationError('parameter validation failed with the following errors:\n' + JSON.stringify(errors), errors);
    }
    
    // build a results object and return it
    var results = new validateParams.Result();
    results._parameterList = params;
    results._constraintList = constraints;
    results._options = options;
    results._validateAttributes = valdiateAttributes;
    results._validateConstraints = validateConstraints;
    results._errors = errors;
    return results;
};

/**
 * A function which applies coercions, but does not do any validation.
 *
 * The values in the passed parameter list will be updated according to any
 * coercions defined in the constraint list.
 *
 * Since the parameter list is an array-like object, it is passed by reference,
 * so the changes will be made directly within the list, and there is no need
 * to return anything. However, purely for convenience, the reference is also
 * returned.
 *
 * @param {Array} params - the list of parameters to be coerced.
 * @param {Array} constraints - the list of constraints which could contain
 * coercions to be applied.
 * @param {Object} [options] - A plain object with options (not currently used).
 * @returns {Array} A reference to the parameter list.
 * @since version 1.1.1
 */
validateParams.coerce = function(params, constraints, options){
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
    if(typeof options === 'undefined') options = {}; // make sure there's always an options object
    
    // apply any defined coercions
    for(var i = 0; i < constraints.length; i++){
        if(validate.isObject(constraints[i]) && validate.isFunction(constraints[i].meta_coerce)){
            // apply the coercion
            params[i] = constraints[i].meta_coerce(params[i]);
        }
    }
    
    // return the parameter list
    return params;
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
 * // basic example - 2 required parameters
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
 *
 * // example with a coercion
 * function getAPIURL(baseURL){
 *     validateParams.assert(arguments, [{
 *         presence: true,
 *         url: {
 *             schemes: ['http', 'https'],
 *             allowLocal: true
 *         },
 *         meta_coerce: function(v){
 *            // append a trailing / if needed
 *            return typeof v === 'string' && !v.match(/\/$/) ? v + '/' : v;
 *         }
 *     }]);
 *     return baseURL + 'api.php';
 * }
 */
validateParams.assert = function(params, constraints, options){
    if(typeof options !== 'object'){
        options = {};
    }
    options.fatal = true;
    return validateParams.apply(params, constraints, options).validateAttributes();
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
//=== Validation Result Prototype ==============================================
//

/**
 * A prototype for objects representing the results of validating a list of
 * parameters against a list of constraints. Instances of this prototype should
 * only be constructed internally within the
 * [validateParams.apply()]{@link module:validateParams.apply} function.
 *
 * @constructor
 * @alias module:validateParams.Result
 * @see module:validateParams.apply
 * @since version 1.1.1
 */
validateParams.Result = function(){
    /**
     * A referece to the parameter list passed to `validateParams.apply()`.
     * @private
     * @type {Object[]}
     */
    this._parameterList = [];
    
    /**
     * A reference to the constraint list passed to `validateParams.apply()`.
     * @private
     * @type {ValidateParamsConstraints[]}
     */
    this._constraintList = [];
    
    /**
     * A reference to the options passed through to `validate()` via
     * `validateParams.apply()`.
     * @private
     * @type {Object}
     */
    this._options = {};
    
    /**
     * A reference to the attributes data structure generated by
     * `validateParams.apply()` and passed to `validate()`.
     * @private
     * @type {Object}
     */
    this._validateAttributes = {};
    
    /**
     * A reference to the constrains data structure generated by
     * `validateParams.apply()` and passed to `validate()`.
     * @private
     * @type {Object.<string, ValidateConstraints>}
     */
    this._validateConstraints = {};
    
    /**
     * A reference to the return value from `validate()`, the structure of this
     * variable will determined by the format option used during the validation.
     * @private
     * @type {(Object|Array|undefined)}
     */
    this._errors = undefined;
};

/**
 * A read-only accessor to a reference to the parameter list used for the
 * validation.
 *
 * @alias module:validateParams.Result#parameterList
 * @returns {Object[]}
 */
validateParams.Result.prototype.parameterList = function(){
    return validate.isArray(this._parameterList) || validateParams.isArguments(this._parameterList) ? this._parameterList : [];
};

/**
 * A read-only accessor to a reference to the constraint list used for the
 * validation.
 *
 * @alias module:validateParams.Result#constraintList
 * @returns {ValidateParamsConstraints[]}
 */
validateParams.Result.prototype.constraintList = function(){
    return validate.isArray(this._constraintList) ? this._constraintList : [];
};

/**
 * A read-only accessor to a reference to the options passed to
 * [validate()]{@link external:validate} for validation.
 *
 * @alias module:validateParams.Result#options
 * @returns {Object}
 * @see external:validate
 */
validateParams.Result.prototype.options = function(){
    return validate.isObject(this._options) ? this._options : {};
};

/**
 * A read-only accessor to a reference to the generated attributes data
 * structure that was passed to [validate()]{@link external:validate} for
 * validation.
 *
 * @alias module:validateParams.Result#validateAttributes
 * @returns {Object}
 * @see external:validate
 */
validateParams.Result.prototype.validateAttributes = function(){
    return validate.isObject(this._validateAttributes) ? this._validateAttributes : {};
};

/**
 * A read-only accessor to a reference to the generated constraints data
 * structure that was passed to [validate()]{@link external:validate} for
 * validation.
 *
 * @alias module:validateParams.Result#validateConstraints
 * @returns {Object.<string, ValidateConstraints>}
 * @see external:validate
 */
validateParams.Result.prototype.validateConstraints = function(){
    return validate.isObject(this._validateConstraints) ? this._validateConstraints : {};
};

/**
 * A read-only accessor to the value returned from the call to
 * [validate()]{@link external:validate}. The format option used will determin
 * the type returned.
 *
 * @alias module:validateParams.Result#errors
 * @returns {(Object|Array|undefined)}
 * @see external:validate
 */
validateParams.Result.prototype.errors = function(){
    return this._errors;
};

//
//=== Public Utility Functions =================================================
//

/**
 * An accessor to return a reference to the instance of the `validate()`
 * function from validate.js used by this module.
 *
 * @alias module:validateParams.getValidateInstance
 * @returns {function}
 * @since version 0.1.1
 * @example
 * var paramsValidateFn = validateParams.getValidateInstance();
 */
validateParams.getValidateInstance = function(){
    return validate;
};

/**
 * An alias for
 * [validateParams.getValidateInstance()]{@link module:validateParams.getValidateInstance}.
 *
 * @alias module:validateParams.validateJS
 * @see module:validateParams.getValidateInstance
 * @since version 1.1.1
 */
validateParams.validateJS = validateParams.getValidateInstance;

/**
 * A function to create a copy of a constraint object which omits any
 * meta-validators present in the original. In other words, all keys in the
 * original are coppied to the new returned object, except those who's names
 * start with `meta_`.
 *
 * This function does not throw errors, if it receives invalid input, it simply
 * returns it un-altered, but it will log a warning if it does so.
 *
 * @alias module:validateParams.filterMetaValidators
 * @param {ValidateParamsConstraints} constraintObject - the constraint object to be coppied and
 * filtered.
 * @returns {ValidateConstraints} - a new object containing every key-value pair in the
 * original, except those who's name begins with `meta_`.
 * @since version 0.2.1
 */
validateParams.filterMetaValidators = function(constraintObject){
    // return invalid data immediately
    if(typeof constraintObject !== 'object'){
        validateParams._warn('meta contraint filter passing invalid arguments un-changed');
        return constraintObject;
    }
    
    // itterate over all the keys and geneate a new object
    var filteredConstraint = {};
    Object.keys(constraintObject).forEach(function(k){
        if(!k.match(/^meta[_]/)){
            filteredConstraint[k] = constraintObject[k];
        }
    });
    
    // return the new object
    return filteredConstraint;
}

/**
 * A function to test if a given item is an Arguments object.
 *
 * This implementation is based on
 * [this answer on Stack Overflow]{@link https://stackoverflow.com/a/29924715/174985}.
 *
 * @alias module:validateParams.isArguments
 * @param {*} item - the item to test.
 * @returns {boolean} `true` if the item is an Arguments object, `false`
 * otherwise.
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
 * A function to test if a given item is a plain object.
 *
 * The criteria is that a plain object has a `typeof` of `object`, is not `null`
 * and has `Object` at the top of its inheritance tree.
 *
 * @alias module:validateParams.isPlainObject
 * @param {*} item - the item to test.
 * @returns {boolean} `true` if the item is an plain object, `false`
 * otherwise.
 * @since version 1.1.1
 * @example
 * validateParams.isPlainObject(undefined); // false
 * validateParams.isPlainObject(null); // false
 * validateParams.isPlainObject(4); // false
 * validateParams.isPlainObject(NaN); // false
 * validateParams.isPlainObject([1, 2]); //false
 * validateParams.isPlainObject(function(){return true;}); // false
 * validateParams.isPlainObject(new Date()); // false
 * validateParams.isPlainObject({}); // true
 * validateParams.isPlainObject({a: 'b'}); // true
 */
validateParams.isPlainObject = function(item){
    // if it's not an object, immediately reject
    if(typeof item !== 'object') return false;
    
    // if the item is null, immediately reject
    if(item === null) return false;
    
    // otherwise, return based on whether Object is at the top of the inheritance tree
    return Object.prototype.toString.call( item ) === '[object Object]';
};

/**
 * A lookup table with all the possible strings returned by the `typeof`
 * operator.
 * @alias module:validateParams._typeofStringsLookup
 * @member
 * @private
 * @type {Object.<string, string>}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof}
 * @since version 0.1.1
 */
validateParams._typeofStringsLookup = {
    'undefined': true,
    'object': true,
    'boolean': true,
    'number': true,
    'string': true,
    'symbol': true,
    'function': true
};

/**
 * A function to test if a given value is one of the possible strings returned
 * by the `typeof` operator.
 *
 * @alias module:validateParams.isTypeofString
 * @param {*} v - the value to test
 * @returns {boolean} `true` if the item is a string returned by `typeof`,
 * `false` otherwise.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof}
 * @since version 0.1.1
 * @example
 * var isValid1 = validateParams.isTypeofString('number'); // true
 * var isValid2 = validateParams.isTypeofString('num'); // false
 */
validateParams.isTypeofString = function(v){
    return typeof v === 'string' && validateParams._typeofStringsLookup[v] ? true : false;
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

/**
 * Register the custom validators defined in
 * {@link module:validateParams.validators} into an instance of the
 * [validate()]{@link external:validate} function.
 *
 * @param {function} [v] - the instance of the
 * [validate()]{@link external:validate} function to registe the custom
 * validators into. Defaults to the instance of `validate()` used within this
 * module.
 * @throws {Error} An error is thrown if an argument is present, but is not
 * valid.
 * @see module:validateParams.validators
 * @see external:validate
 * @see [validate.js Custom Validators]{@link https://validatejs.org/#custom-validator}
 * @since version 0.1.1
 */
validateParams.registerValidators = function(v){
    // default to using the loaded copy of validate
    if(typeof v === 'undefined'){
        v = validate;
    }
    
    // make sure we have a valid validators object
    if(typeof v !== 'function' && typeof v.validators !== 'object'){
        throw new Error('invalid arguments');
    }
    
    // register all our validators
    Object.keys(validateParams.validators).forEach(function(vName){
        v.validators[vName] = validateParams.validators[vName];
    });
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

//
//=== Custom Validators ========================================================
//

/**
 * Custom validate.js validators.
 *
 * These validators are automatically registered with the instance of
 * validate.js loaded by this module. They can be loaded into another instance
 * with the `validateParams.registerValidators()` function.
 *
 * @alias module:validateParams.validators
 * @namespace
 * @see [validate.js Custom Validators]{@link https://validatejs.org/#custom-validator}
 * @since version 0.1.1
 */
validateParams.validators = {
    /**
     * A validator for filtering values by the result of applying the `typeof`
     * operator to them.
     *
     * In keeping with guidelines in the validate.js documentation, this
     * validator implicitly accepts undefined values. However, it does not use
     * the [validate.isEmpty()]{@link external:isEmpty} function to implicitly
     * pass values because it makes no sense to have an empty string, or a
     * string with only white space pass as a callback or a number. Explicit
     * rejection of undefined values can be enabled using the `defined` option
     * and its aliases. Because undefinedness is dealt with separately, the
     * string `'undefined'` is ignored when processing the list of acceptable
     * types.
     *
     * When used in a constraint, this validator supports the following values:
     *
     * * A plain object specifying one or more of the following opions:
     *   * `type` or `types` - a single string, or an array of strings
     *     respectively, specifying one or more types to match against.
     *   * `invert`, `notEqual`, 'notAnyOf' or `not` - if any of these keys has
     *     a truthy value the validator will accpet any type that's not
     *     specified in the `type` or `types` key. That is to say, the validator
     *     will perform an inverse match.
     *   * `notUndefined`, `defined` or `required` - if any of these keys has a
     *     truthy value, undefined values will be rejected, regardless of any
     *     the values specified via the `type` or `types` options.
     * * An array of strings - a shortcut for `{ types: THE_ARRAY }`, i.e. the
     *   type must be one of the strings in the array.
     * * A string - a shortcut for `{ type: 'THE_STRING' }`, i.e. the type must
     *   be the given string.
     * * `true` - a shortcut for `{ notUndefined: true, invert: true }`, i.e.
     *   the value can have any type other than `'undefined'`.
     *
     * @member
     * @type {Validator}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof}
     * @example
     * // a first parameter that can be anything, as long as it's defined
     * validateParams.assert(arguments, [ { hasTypeof: true } ]);
     * 
     * // an optional first parameter that must be a callback if present
     * validateParams.assert(arguments, [ { hasTypeof: 'function' } ]);
     *
     * // a required first parameter that must be a string or a number
     * validateParams(arguments, [
     *     {
     *         hasTypeof: {
     *             types: ['string', 'number'],
     *             notUndefined: true
     *         }
     *     }
     * ]);
     *
     * // an optional first parameter that can be anything but a function
     * validateParams(arguments, [
     *     { hasTypeof: { type: 'function', invert: true } }
     * ]);
     */
    hasTypeof: function(value, options){
        // interpret the specified options
        var specifiedTypes = [];
        var doRequire = false;
        var doInvert = false;
        if(typeof options === 'boolean'){
            // validate() does not run a validator set to false at all, so must be true
            doRequire = true;
            doInvert = true;
        }else if(typeof options === 'string'){
            specifiedTypes.push(options);
        }else if(validate.isArray(options)){
            specifiedTypes = options;
        }else if(validate.isObject(options)){
            // read the type or types from the object
            if(typeof options.type !== 'undefined'){
                if(typeof options.type === 'string'){
                    specifiedTypes.push(options.type);
                }else{
                    validateParams._warn('skipping invalid type specification: ' + String(options.type));
                }
            }else if(typeof options.types !== 'undefined'){
                if(typeof options.types === 'string'){
                    specifiedTypes.push(options.types);
                }else if(validate.isArray(options.types)){
                    specifiedTypes = options.types;
                }else{
                    throw new Error('invalid types specification in options - must be a string or an array of strings');
                }
            }
            
            // see if we should reject undefined
            if(options.notUndefined || options.defined || options.required){
                doRequire = true;
            }
            
            // see if we need to invert
            if(options.invert || options.notEqual || options.notAnyOf || options.not){
                doInvert = true;
            }
        }else{
            throw new Error('invalid options passed - must be `true`, a string, an array of strings, or a plain object');
        }
        
        
        var errors = [];
        var valType = typeof value;
        
        // deal with undefined
        if(valType === 'undefined'){
            if(doRequire){
                return 'cannot be undefined';
            }else{
                // implicitly pass
                return undefined; 
            }
        }
        
        // validate the specified types
        var typeList = [];
        specifiedTypes.forEach(function(t){
            if(validateParams.isTypeofString(t)){
                if('undefined' === t){
                    validateParams._warn("ignoring type specification 'undefined' (see documentation)");
                }else{
                    typeList.push(t);
                }
            }else{
                validateParams._warn('skipping invalid type specification: ' + String(t));
            }
        });   
        
        // do the hard work
        if(doInvert){
            typeList.forEach(function(t){
                if(valType == t){
                    errors.push("can't have type '" + t + "'");
                }
            });
        }else{
            if(typeList.length){
                var matched = false;
                typeList.forEach(function(t){
                    if(valType == t){
                        matched = true;
                    }
                });
                if(!matched){
                    errors.push("must be one of the following types: " + humanJoin(typeList) + "'");
                }
            }else{
                throw new Error('no valid allowed types specfified');
            }
        }
        
        // return as appropriate
        if(errors.length > 0){
            return errors;
        }
        return undefined;
    },
    
    /**
     * A validator for filtering values by testing them against a given
     * prototype or prototypes with the `instanceof` operator.
     *
     * In keeping with guidelines in the validate.js documentation, this
     * validator implicitly accepts undefined values. However, it does not use
     * the [validate.isEmpty()]{@link external:isEmpty} function to implicitly
     * pass values because it makes no sense to have an empty string, or a
     * string with only white space pass as an instance of a given prototype.
     * Explicit rejection of undefined values can be enabled using the `defined`
     * option and its aliases.
     *
     * Only undefined values and values for which the
     * [vadidate.isObject()]{@link external:isObject} function returns true will
     * ever be accepted by this validator.
     *
     * When used in a constraint, this validator supports the following values:
     *
     * * A plain object with the following keys:
     *   * `prototypes` **required** - an array of one or more prototypes.
     *   * `invert`, `notEqual` or `not` - if any of these keys have a truthy
     *     value only objects that don't have any of the specified prototypes
     *     will be accepted.
     *   * `notUndefined`, `defined` or `required` - if any of these keys has a
     *     truthy value, undefined values will be rejected.
     * * An array of prototypes - equivalent to `{ prototypes: THE_ARRAY }`
     * * `true` - equivalent to `{ notUndefined:true, invert: true }`, i.e. any
     *   object is accepted, and undefined values are rejected.
     *
     * @member
     * @type {Validator}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof}
     * @example
     * // a first parameter that can be any object, as long as it's defined
     * validateParams.assert(arguments, [ { isInstanceof: true } ]);
     *
     * // an optional first parameter that can be any object
     * validateParams.assert(arguments, [ { isInstanceof: { invert: true } } ]);
     *
     * // an optional first parameter that can be any error
     * validateParams.assert(arguments, [ { isInstanceof: [Error] } ]);
     *
     * // an optional first parameter that can be any error or a Date
     * validateParams.assert(arguments, [ { isInstanceof: [Error, Date] } ]);
     *
     * // an optional first parameter than can be an object of any prototype
     * // other than an Error
     * validateParams.assert(arguments, [
     *     {
     *         isInstanceof: {
     *             prototypes: [ Error ],
     *             invert: true
     *         }
     *     }
     * ]);
     */
    isInstanceof: function(value, options){
        // interpret the specified options
        var specifiedPrototypes = [];
        var doRequire = false;
        var doInvert = false;
        if(typeof options === 'boolean'){
            // validate() does not run a validator set to false at all, so must be true
            doRequire = true;
            doInvert = true;
        }else if(validate.isArray(options)){
            specifiedPrototypes = options;
        }else if(validate.isObject(options)){
            // try read out the prototypes
            if(typeof options.prototypes !== 'undefined'){
                if(validate.isArray(options.prototypes)){
                    specifiedPrototypes = options.prototypes;
                }else{
                    throw new Error('invalid options passed - options.prototypes must be an array');
                }
            }
            
            // see if we should reject undefined
            if(options.notUndefined || options.defined || options.required){
                doRequire = true;
            }
            
            // see if we need to invert
            if(options.invert || options.notEqual || options.notAnyOf || options.not){
                doInvert = true;
            }
        }else{
            throw new Error('invalid options passed - must be `true`, an array of prototypes, or a plain object');
        }
        
        // deal with undefined
        if(typeof value === 'undefined'){
            if(doRequire){
                return 'cannot be undefined';
            }else{
                // implicitly pass
                return undefined; 
            }
        }
        
        // validate the specified prototypes
        var prototypeList = [];
        specifiedPrototypes.forEach(function(p){
            if(typeof p === 'function'){
                prototypeList.push(p);
            }else{
                validateParams._warn('skipping invalid value in prototypes array: ' + String(p));
            }
        });
        
        // do the hard work
        var errors = [];
        if(doInvert){
            if(validate.isObject(value)){
                prototypeList.forEach(function(p){
                    if(value instanceof p){
                        errors.push("can't have prototype '" + String(p) + "'");
                    }
                });
            }else{
                errors.push('must be an object');
            }
        }else{
            if(prototypeList.length){
                var matched = false;
                prototypeList.forEach(function(p){
                    if(value instanceof p){
                        matched = true;
                    }
                });
                if(!matched){
                    errors.push("must have one of the following prototypes: " + humanJoin(prototypeList) + "'");
                }
            }else{
                throw new Error('no valid allowed prototypes specfified');
            }
        }
        
        // return as appropriate
        if(errors.length > 0){
            return errors;
        }
        return undefined;
    }
};

/**
 * An alias for the `hasTypeof` validator.
 * @alias module:validateParams.validators.hasTypeOf
 * @member
 * @type {validator}
 * @see module:validateParams.validators.hasTypeof
 */
validateParams.validators.hasTypeOf = validateParams.validators.hasTypeof;

/**
 * An alias for the `isInstanceof` validator.
 * @alias module:validateParams.validators.isInstanceOf
 * @member
 * @type {validator}
 * @see module:validateParams.validators.isInstanceof
 */
validateParams.validators.isInstanceOf = validateParams.validators.isInstanceof;

validateParams.registerValidators(); // register all the defined validators

//
//=== Export the Module ========================================================
//

// If we're in a Node environment, export the function
if(module){
    module.exports = validateParams;
}