/**
 * @file Provides the [validateParams]{@link module:validateParams} module.
 * @version 1.1.1
 * @author Bart Busschots <bart.busschots@mu.ie>
 * @license MIT
 * @see https://github.com/bbusschots-mu/validateParams.js
 */

//
//=== JSDoc ground-work ========================================================
//

//
//--- Define External Types ----------------------------------------------------
//

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
 * A validate.js compatible validator function.
 * @external Validator
 * @see {@link https://validatejs.org/#custom-validator}
 */

//
//--- Define Global Types ------------------------------------------------------
//

/**
 * A validate.js contraints data structure maps attribute names to sets of
 * validations:
 *
 * ```
 * {
 *     <attribute name>: {
 *         <validator name>: <validator options>
 *         ...
 *     }
 *     ...
 * }
 * ```
 *
 * This type refers to just the value part of the outter name-value pairs in
 * this data structure. I.e. an object mapping validator names to validator
 * options.
 * 
 * @typedef {Object} AttributeContraints
 * @see {@link https://validatejs.org/#constraints}
 * @example
 * // A validate.js contraint value specifying two validations
 * {
 *     presence: true; // the precence validator with single-value options
 *     url: { // the url validator with more complex options
 *         schemes: ['http', 'https'],
 *         allowLocal: true
 *     }
 * }
 */

/**
 * A plain object describing how the functions within this module should treat
 * a single parameter. The object can contain a mix of validate.js validations
 * and per-parameter options.
 *
 * Validate.js validations are name-value pairs where the name is the name of
 * the validator that should be applied, and the value is the options that
 * should be passed to that validator.
 *
 * Per-parameter options can be grouped into a single name-value pair named
 * `paramOptions`, or added individually as name-value pairs where the name
 * is the option name pre-fixed with `vpopt_`.
 *
 * This type is a super-set of {@link AttributeContraints}.
 * 
 * @typedef {Object} ParameterConstraints
 * @see AttributeContraints
 * @example
 * // a set of parameter constraints specifying options for two validators
 * // and specifying one per-parameter option using the prefix-approach
 * {
 *     presence: true; // the presence validator with single-value options
 *     url: {
 *         schemes: ['http', 'https'],
 *         allowLocal: true
 *     }, // the url validator with more complex options
 *     vpopt_coerce: function(v){ // the coerce per-parameter option
 *         return typeof v === 'string' && !v.match(/\/$/) ? v + '/' : v;
 *     }
 * }
 *
 * // a set of parameter constraints specifying options for two validators
 * // and specifying two per-parameter options using the single-key approach
 * {
 *     presence: true; // the presence validator with single-value options
 *     url: {
 *         schemes: ['http', 'https'],
 *         allowLocal: true
 *     }, // the url validator with more complex options
 *     paramOptions: { // the per-parameter options
 *         // the coerce per-parameter option
 *         coerce: function(v){ // the coerce per-parameter option
 *             return typeof v === 'string' && !v.match(/\/$/) ? v + '/' : v;
 *         },
 *         // the name per-parameter option
 *         name: 'baseURL'
 *     }
 * }
 */

//
//--- Callback Definitions -----------------------------------------------------
//

/**
 * A coercion callback for use with the `coerce` per-parameter option.
 *
 * Values that do not need to be altered by the coercion should still be
 * returned, otherwise they will be interpreted as coercions to `undefined`.
 * 
 * @callback CoercionCallback
 * @param {*} val - the value to be coerced.
 * @returns {*} The coerced value.
 * @see module:valdiateParams.validate
 * @example
 * function coerceIntoRange(val){
 *     // if the value is a number or a number as a string, we might need to
 *     // coerce it
 *     if(validateParams.isNumberLike(val)){
 *         if(val < 0) return 0;
 *         if(val > 10) return 10;
 *     }
 *
 *     // always return the original value if we have not returned already
 *     return val;
 * }
 */

//
//--- Module Documentation -----------------------------------------------------
//

/**
 * A wrapper around [validate.js]{@link http://validatejs.org/} designed to
 * facilitate its use for function parameter validation.
 *
 * Since validate.js was designed for valdiating web forms, it's designed to
 * validate named data attributes, however, function parameter lists are flat
 * array-like structures of values. This module is designed to bridge that
 * gap in a developer-friendly way, and, to add extra functionality that makes
 * working with function parameters easier, such as additional
 * validate.js-compatible
 * [custom validators]{@link module:validateParams.validators}, and support for
 * data coercion.
 *
 * This module exports its functionality as a single main function,
 * [validateParams()]{@link module:validateParams~validateParams}, which
 * contains further helper functions as properties. This is the same design
 * pattern implemented by validate.js.
 *
 * The module's core functionality is implemented by the function
 * [validateParams.validate()]{@link module:validateParams.validate}, so that
 * function's description is a great starting point for getting to grips with
 * this module, however, in your code you will probably chose to use one of
 * two wrappers around this function:
 *
 * * [validateParams()]{@link module:validateParams~validateParams} - returns
 *   lists of errors or `undefined` in the same way the `validate()` function
 *   from validate.js does.
 * * [validateParams.assert()]{@link module:validateParams.assert} - throws
 *   [validateParams.ValidationError]{@link module:validateParams.ValidationError}
 *   errors rather than returning lists of errors.
 * 
 * @module validateParams
 * @requires module:validate.js
 * @see [validate.js Documentation]{@link https://validatejs.org/}
 */

//
//=== Module Setup & Required Imports ==========================================
//

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
//=== The Main Validation Functions (and shortcut wrappers) ====================
//

/**
 * A wrapper around the
 * [validateParams.validate()]{@link module:validateParams.validate} function
 * which returns values consistently with the
 * [validate()]{@link external:validate} function from validate.js.
 *
 * @param {(Arguments|Array)} params - an array-like object containing data to
 * be validated, often a function's special `arguments` object.
 * @param {ParameterConstraints[]} constraints - an array of parameter
 * constraints, one for each parameter to be validated. The validations and
 * per-parameter options defined in the first element in this array will be
 * applied to the first element in `params`, the validations and options defined
 * in the second element in this array to the second element in `params`, and
 * so on.
 * @param {Object} [options] - an associative array of options, both for the
 * [validate()]{@link external:validate} function from validate.js, and the
 * [validateParams.validate()]{@link module:validateParams.validate} function.
 * (The supported options are detailed in the documenation for
 * [validateParams.validate()]{@link module:validateParams.validate})
 * @returns {(undefined|Object|string[])} Like the
 * [validate()]{@link external:validate} function from validate.js, this wrapper
 * returns `undefined` when all parameters pass the specified constraints, and
 * returns either an array of error strings, or an object mapping parameter
 * names (`param1`, `param2` etc. by default) to error strings or error details
 * depending on the value of `options.format`.
 * @throws {Error} throws an error on invalid arguments.
 * @throws {validateParams.ValidationError} throws a validation error if the
 * parameters fail to validate and `options.fatal=true`.
 * @see module:validateParams.validate
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
 *         console.log(errors);
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
    return validateParams.validate(params, constraints, options).errors();
};

/**
 * The primary validation function provided by this module. The other two
 * provided validation functions,
 * [validateParams()]{@link module:validateParams~validateParams} and
 * [validateParams.assert()]{@link module:validateParams.assert} are wrappers
 * around this function.
 *
 * This function transforms the passed paramter list `params` and constraints
 * list `constraints` into data structures that can be validated by the
 * [validate()]{@link external:validate} function from validate.js.
 *
 * Specifically, parameter lists (`param`) of the form:
 *
 * ```
 * ['stuff', [1, 2, 3], {a: 'b'}]
 * ```
 *
 * get transformed into valdiate.js-compatible attribute objects of the form:
 *
 * ```
 * {
 *     param1: 'stuff',
 *     param2: [1, 2, 3],
 *     param3: {a: 'b'}
 * }
 * ```
 *
 * By default, the values in the parameter list are coerced with the
 * [validateParams.coerce()]{@link module:validateParams.coerce} function before
 * being transformed into the attributes object. This can be suppressed by
 * setting `options.coerce=false`.
 *
 * Similarly, constraint lists (`constraints`) of the form:
 * 
 * ```
 * [
 *     {presence: true},
 *     {
 *         presence: true,
 *         numericality: {
 *             onlyInteger: true,
 *             strict: true
 *         }
 *     },
 *     {
 *         hasTypeof: 'boolean',
 *         vpopt_coerce: function(val){ // a parameter-specific option
 *             return val ? true : false;
 *         };
 *     }
 * ]
 * ```
 *
 * get transformed into validate.js-compatible constraints objects of the form:
 *
 * ```
 * {
 *     param1: {presence: true}
 *     param2: {
 *         numericality: {
 *             onlyInteger: true,
 *             strict: true
 *         }
 *     },
 *     param3: {hasTypeof: 'boolean'} // parameter-specific option not included
 * }
 * ```
 *
 * The objects within the constraints list can contain parameter-specific
 * options, such as coercions, but these are not included in the generated
 * constraints objects. For more information on parameter-specific options, see
 * below.
 *
 * This function returns a
 * [validateParams.Result]{@link module:validateParams.Result} object containing
 * references to the parameter list, the constraints list, the options object,
 * the generated attributes object, the generated constraints object, and the
 * value returned by the [validate()]{@link external:validate} function from
 * validate.js
 *
 * The `options` object can contain any option understood by the
 * [validate()]{@link external:validate} function from validate.js as well as
 * options understood by this function.
 *
 * ##### Parameter-specific Options
 *
 * This module adds support for a number parameter-specific options that do not
 * exist in validate.js. These options are specified within the constraint
 * objects that make up the constraint list. These options will be stripped from
 * the constraint before they are passed on to the
 * [validate()]{@link external:validate} function.
 *
 * For convenience, Parameter-specific options can be specified in two ways.
 *
 * Options can be collected into a single plain object and included into a
 * parameter constraint with the name `paramOptions`. This works well when you
 * need to specify multiple options on a single parameter.
 *
 * The alternative to collecting the parameter-specific options into a single
 * plain object is to add them directly into the constraint, but with their
 * name prefixed with `vpopt_`.
 *
 * ##### Coercions (Parameter-specific option `coerce`)
 *
 * A coercion is a function which attempts to transform an invalid value into
 * a valid one before validation is performed. Coercions alter the values stored
 * in the parameter list.
 *
 * More detailed information and examples are provided as part of the
 * [validateParams.coerce()]{@link module:validateParams.coerce} function.
 *
 * @alias module:validateParams.validate
 * @param {(Arguments|Array)} params - an array-like object containing data to
 * be validated, often a function's special `arguments` object.
 * @param {ParameterConstraints[]} constraints - an array of parameter
 * constraints, one for each parameter to be validated. The validations and
 * per-parameter options defined in the first element in this array will be
 * applied to the first element in `params`, the validations and options defined
 * in the second element in this array to the second element in `params`, and
 * so on.
 * @param {Object} [options] - an associative array of options, both for the
 * [validate()]{@link external:validate} function from validate.js, and this
 * function.
 * @param {string} [options.format='grouped'] - the format in which to return
 * any error messages found. For details see the
 * [Format section of the validate.js docs]{@link https://validatejs.org/#validate-error-formatting}.
 * @param {boolean} [options.fullMessages=true] - whether or not to pre-fix
 * error messages with the variable name (`param1` etc.).
 * @param {boolean} [options.coerce=true] - whether or not to apply coercions
 * before validating.
 * @param {boolean} [options.fatal=false] - whether or not to throw a
 * [validateParams.ValidationError]{@link module:validateParams.ValidationError}
 * when there is a validation error rather than returning a results object.
 * @returns {module:validateParams.Result}
 * @throws {TypeError} A type error is thrown if the function is invoked with
 * invalid parameters.
 * @throws {validateParams.ValidationError} A validation error is thrown if the
 * values in the specified parameter list `params` do not pass the constraints
 * specified in the constraints list `constraints` and `options.fatal=true`.
 * @since version 1.1.1
 * @see external:validate
 * @see module:validateParams.coerce
 * @example <caption>Basic Usage - A factorial function</caption>
 * function factorial(n){
 *     var validationResult = validateParams(arguments, [{
 *         presence: true,
 *         numericality: {
 *             onlyInteger: true,
 *             greaterThanOrEqualTo: 0
 *         }
 *     }]);
 *     if(validationResult.fail()){
 *         throw new TypeError(validationResult.asString());
 *     }
 *     if(n <= 1){
 *         return 1;
 *     }
 *     return n * factorial(n - 1);
 * }
 * @example <caption>Coercion - A String Repeater</caption>
 * function repeatString(){
 *     validateParams(
 *         arguments,
 *         [
 *             { // first parameter
 *                 presence: true,
 *                 vpopt_coerce: function(val){ return String(val) }
 *             },
 *             { // second parameter
 *                 numericality: {
 *                     onlyInteger: true,
 *                     greaterThan: 0
 *                 }
 *                 vpopt_coerce: function(val){
 *                     if(!validateParams.isNumeric(val)) return 1;
 *                     if(val < 1) return 1;
 *                     return parseInt(val);
 *                 }
 *             }
 *         ],
 *         {fatal: true} // global option to throw error if validation fails
 *     );
 *     var s = arguments[0];
 *     var n = arguments[1];
 *     var ans = '';
 *     while(n > 0){
 *        ans += s;
 *        n--;
 *     }
 *     return ans;
 * }
 */
validateParams.validate = function(params, constraints, options){
    // counter for use in loops
    var i;
    
    // validate parameters
    if(!(params && (validate.isArray(params) || validateParams.isArguments(params)))){
        throw new TypeError('first parameter must be an array of parameters to test, or an Arguments object');
    }
    if(!validate.isArray(constraints)){
        throw new TypeError('second parameter must be an array of constraints to test against');
    }
    if(typeof options !== 'undefined' && !validateParams.isPlainObject(options)){
        throw new TypeError('if present, the third parameter must be a plain object');
    }
    
    // deal with default option values
    if(typeof options === 'undefined'){
        options = {};
    }
    if(typeof options.coerce === 'undefined'){
        options.coerce = true;
    }else{
        options.coerce = options.coerce ? true : false;
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
    
    // apply any defined coercions if appropriate
    if(options.coerce){
        validateParams.coerce(params, constraints, options);
    }
    
    // build the values and constraints objects
    var valdiateAttributes = {};
    var validateConstraints = {};
    for(i = 0; i < constraints.length; i++){
        var paramName = 'param' + (i + 1);
        valdiateAttributes[paramName] = params[i];
        validateConstraints[paramName] = validate.isObject(constraints[i]) ? validateParams.paramConstraintsAsAttrConstraints(constraints[i]) : {};
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
 * The values in the passed parameter list (`param`) will be updated according
 * to any coercions defined in the constraints list (`constraints`).
 *
 * Since the parameter list is an array-like object, it's passed by reference,
 * so the changes will be made directly within the list, and there is no need
 * to return anything. However, purely for convenience, a reference to the
 * parameter list is returned.
 *
 * Coercions are implemented as a parameter-specific option named `coerce`.
 * There is more information on on parameter-specific options available in the
 * description of the
 * [validateParams.validate()]{@link module:validateParams.validate} function.
 *
 * A coercion is simply a callback which will be called with the value to be
 * coerced as the first and only argument, and which should return the coerced
 * value. Values that do not need to be altered by a coercion should still be
 * returned, otherwise the value will be coerced to `undefined`. See the
 * {@link CoercionCallback} type definition for more details.
 *
 * When coercing the `arguments` object, bear in mind that while the value in
 * the `arguments` object will get updated, the value stored in corresponding
 * named arguments will not change, as illustrated by the code sample below:
 *
 * ```
 * function demoFn(x){
 *     validateParams.coerce(arguments, [{
 *         presence: true,
 *         numericality: {
 *             onlyInteger: true,
 *             greaterThanOrEqualTo: 0,
 *             lessThanOrEqualTo: 10
 *         }
 *         vpopt_coerce: function(n){
 *             if(n < 0) return 0;
 *             if(n > 10) return 10;
 *             return n;
 *         }
 *     }]);
 *     return (x, arguments[0]);
 * }
 *
 * demoFn(40); // returns [40, 10] because arguments[0] was coerced, but not x
 * ```
 *
 * Note that this function will always coerce the parameter list, even when
 * `options.coerce=false`.
 *
 * @alias module:validateParams.coerce
 * @param {(Arguments|Array)} params - an array-like object containing data to
 * be coerced, as would be passed to the
 * [validateParams.validate()]{@link module:validateParams.validate} function.
 * The special `arguments` object would often be passed here.
 * @param {ParameterConstraints[]} constraints - an array of parameter
 * constraints, as would be passed to the
 * [validateParams.validate()]{@link module:validateParams.validate} function.
 * @param {Object} [options] - A plain object with options (not currently used).
 * @returns {(Arguments|Array)} A reference to the parameter list (`params`).
 * @since version 1.1.1
 * @see module:validateParams.validate
 * @example <caption>A coercion specified using the `vpopt_coerce` per-parameter option</caption>
 * var numConstraint = {
 *     presence: true,
 *     numericality: {
 *         onlyInteger: true,
 *         greaterThanOrEqualTo: 0,
 *         lessThanOrEqualTo: 10
 *     },
 *     vpopt_coerce: function(n){
 *         if(n < 0) return 0;
 *         if(n > 10) return 10;
 *         return n;
 *     }
 * };
 * var data = [-5, 5, 50];
 * validateParams.coerce(data, [numConstraint, numConstraint, numConstraint]);
 * // data now [0, 5, 10]
 * @example <caption>A coercion specified using the `paramOptions.coerce` per-parameter option</caption>
 * var numConstraint = {
 *     presence: true,
 *     numericality: {
 *         onlyInteger: true,
 *         greaterThanOrEqualTo: 0,
 *         lessThanOrEqualTo: 10
 *     },
 *     paramOptions: {
 *         coerce: function(n){
 *             if(n < 0) return 0;
 *             if(n > 10) return 10;
 *             return n;
 *         }
 *     }
 * };
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
        // try find a coercion to apply
        var coerceFn = false;
        if(validate.isObject(constraints[i])){
            // look for vpopt_coerce
            if(validate.isFunction(constraints[i].vpopt_coerce)){
                coerceFn = constraints[i].vpopt_coerce;
            }
            
            // look for a coercion inside paramOptions
            if(validate.isObject(constraints[i].paramOptions) && validate.isFunction(constraints[i].paramOptions.coerce)){
                coerceFn = constraints[i].paramOptions.coerce;
            }
        }
        
        // if a coercion was found, apply it
        if(coerceFn){
            params[i] = coerceFn(params[i]);
        }
    }
    
    // return the parameter list
    return params;
};

/**
 * A wrapper for the
 * [validateParams.validate()]{@link module:validateParams.validate} function
 * that passes all arguments through, but sets `options.fatal` to true, ensuring
 * validation errors trigger the throwing of a
 * [validateParams.ValidationError]{@link module:validateParams.ValidationError}
 * error, and returns a reference to the Attributes data structure generated by
 * `validateParams.validate()` and passed to the
 * [validate()]{@link external:validate} function from validate.js via
 * [validateParams.Result.validateAttributes()]{@link module:validateParams.Result#validateAttributes}.
 *
 * @alias module:validateParams.assert
 * @param {(Arguments|Array)} params - an array-like object containing data to
 * be validated, often a function's special `arguments` object.
 * @param {ParameterConstraints[]} constraints - an array of parameter
 * constraints, one for each parameter to be validated. The validations and
 * per-parameter options defined in the first element in this array will be
 * applied to the first element in `params`, the validations and options defined
 * in the second element in this array to the second element in `params`, and
 * so on.
 * @param {Object} [options] - an associative array of options, both for the
 * [validate()]{@link external:validate} function from validate.js, and the
 * [validateParams.validate()]{@link module:validateParams.validate} function.
 * (The supported options are detailed in the documenation for
 * [validateParams.validate()]{@link module:validateParams.validate})
 * @returns {Object.<string, AttributeContraints>} The generated Attributes
 * object that was passed to the [validate()]{@link external:validate} function
 * from validate.js
 * @throws {validateParams.ValidationError}
 * @see module:validateParams.validate
 * @see module:validateParams.Result#validateAttributes
 * @see external:validate
 * @example <caption>Basic example - 2 required parameters</caption>
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
 * @example <caption>Advanced Example with Coercion</caption>
 * function getAPIURL(baseURL){
 *     validateParams.assert(arguments, [{
 *         presence: true,
 *         url: {
 *             schemes: ['http', 'https'],
 *             allowLocal: true
 *         },
 *         vpopt_coerce: function(v){
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
    return validateParams.validate(params, constraints, options).validateAttributes();
};

//
//=== Custom Validation Error Prototype ========================================
//

/**
 * A custom error prototype for validaiton errors.
 * 
 * @constructor
 * @alias module:validateParams.ValidationError
 * @param {string} [msg=''] - an error message.
 * @param {array|object} [errors=false] - the errors messages as returned by the
 * [validate()]{@link external:validate} function from validate.js.
 * @see {@link https://stackoverflow.com/a/17891099/174985|Based on this StackOverflow answer}
 * @see external:validate
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
 * [validateParams.validate()]{@link module:validateParams.validate} function.
 *
 * @constructor
 * @alias module:validateParams.Result
 * @see module:validateParams.validate
 * @since version 1.1.1
 */
validateParams.Result = function(){
    /**
     * A referece to the parameter list passed to the
     * [validateParams.validate()]{@link module:validateParams.validate}
     * function.
     * @private
     * @type {(Arguments|Array)}
     */
    this._parameterList = [];
    
    /**
     * A reference to the constraint list passed to the
     * [validateParams.validate()]{@link module:validateParams.validate}
     * function.
     * @private
     * @type {ParameterConstraints[]}
     */
    this._constraintList = [];
    
    /**
     * A reference to the options object passed through to the
     * [validate()]{@link external:validate} function from validate.js via
     * [validateParams.validate()]{@link module:validateParams.validate}.
     * @private
     * @type {Object}
     */
    this._options = {};
    
    /**
     * A reference to the attributes data structure generated by
     * [validateParams.validate()]{@link module:validateParams.validate} and
     * passed to the [validate()]{@link external:validate} function from
     * validate.js.
     * @private
     * @type {Object}
     */
    this._validateAttributes = {};
    
    /**
     * A reference to the constrains data structure generated by
     * [validateParams.validate()]{@link module:validateParams.validate} and
     * passed to the [validate()]{@link external:validate} function from
     * validate.js.
     * @private
     * @type {Object.<string, AttributeContraints>}
     */
    this._validateConstraints = {};
    
    /**
     * A reference to the return value from the
     * [validate()]{@link external:validate} function from validate.js, the type
     * and structure of the returned value will be determined by the value of
     * the `format` option.
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
 * @returns {(Arguments|Array)}
 */
validateParams.Result.prototype.parameterList = function(){
    return validate.isArray(this._parameterList) || validateParams.isArguments(this._parameterList) ? this._parameterList : [];
};

/**
 * A read-only accessor to a reference to the constraint list used for the
 * validation.
 *
 * @alias module:validateParams.Result#constraintList
 * @returns {ParameterConstraints[]}
 */
validateParams.Result.prototype.constraintList = function(){
    return validate.isArray(this._constraintList) ? this._constraintList : [];
};

/**
 * A read-only accessor to a reference to the options passed to
 * the [validate()]{@link external:validate} funcrion from validate.js for
 * validation.
 *
 * @alias module:validateParams.Result#options
 * @returns {Object}
 * @see external:validate
 */
validateParams.Result.prototype.options = function(){
    return validate.isObject(this._options) ? this._options : {};
};

/**
 * A read-only accessor to a reference to the generated attributes object that
 * was passed to the [validate()]{@link external:validate} function from
 * validate.js for validation.
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
 * structure that was passed to the [validate()]{@link external:validate}
 * function from validate.js for validation.
 *
 * @alias module:validateParams.Result#validateConstraints
 * @returns {Object.<string, AttributeContraints>}
 * @see external:validate
 */
validateParams.Result.prototype.validateConstraints = function(){
    return validate.isObject(this._validateConstraints) ? this._validateConstraints : {};
};

/**
 * A read-only accessor to the value returned from the call to the
 * [validate()]{@link external:validate} function from vaidate.js. The value of
 * `options.format` passed to `valdidate()` will determin type of the returned
 * data.
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
 * @function
 * @see module:validateParams.getValidateInstance
 * @since version 1.1.1
 */
validateParams.validateJS = validateParams.getValidateInstance;

/**
 * A function to convert a
 * [parameter constraints object]{@link ParameterConstraints} as used in the
 * paramter list for the
 * [validateParams.validate()]{@link module:validateParams.validate} function
 * into an [attribute constraints object]{@link AttributeContraints} as used in
 * the constraints object for the [validate()]{@link external:validate} function
 * from validate.js.
 *
 * Specifically, all keys present in the passed object are coppied to a new
 * object except the one one named `paramOptions` and any who who's names start
 * with `vpopt_`. This new object is then returned by this function.
 *
 * This function does not throw errors, if it receives invalid input, it simply
 * returns it un-altered, but it will log a warning if it does so.
 *
 * @alias module:validateParams.paramConstraintsAsAttrConstraints
 * @param {ParameterConstraints} paramConstraints - the parameter constraints
 * object to be converted into an attribute constraints object.
 * @returns {AttributeContraints} A new object containing every key-value pair
 * from the original, except the one named `paramOptions` and those who's names
 * begins with `vpopt_`.
 * @see module:validateParams.validate
 * @see external:validate
 * @since version 1.1.1
 */
validateParams.paramConstraintsAsAttrConstraints = function(constraintObject){
    // return invalid data immediately
    if(typeof constraintObject !== 'object'){
        validateParams._warn('per-parameter options filter returning invalid constraint data un-changed');
        return constraintObject;
    }
    
    // itterate over all the keys and geneate a new object
    var filteredConstraint = {};
    Object.keys(constraintObject).forEach(function(k){
        if(!(k === 'paramOptions' || k.match(/^vpopt[_]/))){
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