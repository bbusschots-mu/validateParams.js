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
 * The `validate.single()` function from
 * [validate.js]{@link http://validatejs.org/}.
 * @external single
 * @see {@link https://validatejs.org/#validate-single}
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
 * @see module:validateParams.validate
 * @example
 * function coerceIntoRange(val){
 *     // if the value is a number or a number as a string, we might need to
 *     // coerce it
 *     if(validateParams.isNumeric(val)){
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
        
        // deal with any possible nesting
        validateParams._processNestedValidations(paramName, validateConstraints, valdiateAttributes[paramName]);
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
 * A private helper function to recursively resolve nesting for the
 * [validateParams.validate()]{@link module:validateParams.validate} function.
 *
 * @alias module:validateParams._processNestedValidations
 * @private
 * @param {string} validateKey - the key within `validateConstraints` to process
 * nested constraints for.
 * @param {Object.<string, AttributeContraints>} validateConstraints - a
 * constraints object for use with the [validate()]{@link external:validate}
 * function from validate.js.
 * @param {Object} attributeValue - value of the attribute being processed.
 * @see module:validateParams.validate
 * @see external:validate
 * @since version 1.1.1
 */
validateParams._processNestedValidations = function(validateKey, validateConstraints, attributeValue){
    // utility variables
    var curCons = validateConstraints[validateKey]; // the constraint being processed
    
    // if the constraint to be processed does not have an object value, return
    if(!validate.isObject(curCons)) return;
    
    // try descend if the key defines a dictionary
    if(validate.isObject(curCons.dictionary)){
        var curDict = curCons.dictionary; // the dictionary being processed
        
        // if the matching attribute is not also an object, return
        if(!validate.isObject(attributeValue)) return;
        
        // gather the defined key constraints (universal and key-specific)
        var vCons = false;
        if(validate.isObject(curDict.valueConstraints)){
            vCons = curDict.valueConstraints;
        }
        //console.log('universal constraints', vCons);
        var mCons = {};
        if(validate.isObject(curDict.mapConstraints)){
            mCons = curDict.mapConstraints;
        }
        
        // a private inner function for merging per-key and universal constraints
        var mergeKConsUCons = function(mCons, vCons, k){
            var nCons = {}; // the final nested constraints
            
            // if there are per-key constraints for k, add them all
            if(validate.isObject(mCons[k])){
                nCons = validateParams.extendObject({}, mCons[k]);
            }
            
            // loop through each universal constraint and merge as appropraite
            if(vCons){
                Object.keys(vCons).forEach(function(vn){
                    // only add non-clashing universal constraints
                    if(!nCons[vn]){
                        nCons[vn] = vCons[vn];
                    }
                });
            }
            
            // return the merged constraints
            return nCons;
        };
        
        // add nested constraints for the keys in the attribute as appropriate
        Object.keys(attributeValue).forEach(function(objKey){
            // build the name for the nested data within the constraints data structure for validate()
            var nestedKeyName = validateKey + '.' + objKey;
            
            // calculate the appropriate constraints
            var nestedKeyConstraints = mergeKConsUCons(mCons, vCons, objKey);
            
            // if there were any nested constraints, add them and recurse down
            if(Object.keys(nestedKeyConstraints).length){
                validateConstraints[nestedKeyName] = nestedKeyConstraints;
                validateParams._processNestedValidations(nestedKeyName, validateConstraints, attributeValue[objKey]);
            }
        });
        
        // also add nested contraints for any specified keys in the constraint that are not present in the attribute
        // this is only needed for presence and definedness testing, but that is important none-the-less
        Object.keys(mCons).forEach(function(k){
            // skip any key that's present in the object - it has already been dealt with in the loop above
            if(typeof attributeValue[k] !== 'undefined') return;
            
            // add the nested constraint and and recurse down
            var nestedKeyName = validateKey + '.' + k;
            validateConstraints[nestedKeyName] = mergeKConsUCons(mCons, vCons, k);
            validateParams._processNestedValidations(nestedKeyName, validateConstraints, undefined);
        });
    }
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

/**
 * Return the number of errors contained in the result.
 *
 * Note that if a custom error formatter was used, an educated guess will need
 * to be made. If this happens, a warning will be written to the console. The
 * algorithm for making an educated geuess is to return the length if the error
 * value is an array, the number of keys if it's a plain object, or 1.
 *
 * @alias module:validateParams.Result#numErrors
 * @returns {number}
 * @since version 1.1.1
 */
validateParams.Result.prototype.numErrors = function(){
    // if errors are undefined, there were none, so return 0
    if(typeof this._errors === 'undefined') return 0;
    
    // if errors is empty (in the validate.js sense), assume there were no errors and return 0
    if(validate.isEmpty(this._errors)) return 0;
    
    // otherwise, count the errors based on the error format
    var efmt = 'grouped';
    if(validate.isString(this._options.format)){
        efmt = this._options.format;
    }
    if((efmt == 'flat' || efmt == 'detailed') && validate.isArray(this._errors)){
        return this._errors.length;
    }
    if(efmt == 'grouped' && validate.isObject(this._errors)){
        var count = 0;
        var that = this;
        Object.keys(this._errors).forEach(function(ek){
            count += validate.isArray(that._errors[ek]) ? that._errors[ek].length : 1;
        });
        return count;
    }
    
    // if we got here there is a non-standard formatter, so warn that we have
    // to make an educated guess, then make an educated guess
    validateParams._warn('non-standard error formatter used, so returning an educated guess from .numErrors() on validateParams.Result object');
    if(validate.isArray(this._errors)) return this._errors.length;
    if(validateParams.isPlainObject(this._errors)) return Object.keys(this._errors).length;
    return 1;
};

/**
 * Determine whether the result represents a successful validation or not.
 *
 * @alias module:validateParams.Result#pass
 * @returns {boolean}
 * @since version 1.1.1
 */
validateParams.Result.prototype.pass = function(){
    if(typeof this._errors === 'undefined') return true;
    return this.numErrors() === 0;
};

/**
 * An alias for [.pass()]{@link module:validateParams.Result#pass}.
 *
 * @alias module:validateParams.Result#passed
 * @see module:validateParams.Result#pass
 * @since version 1.1.1
 */
validateParams.Result.prototype.passed = validateParams.Result.prototype.pass;

/**
 * Determine whether the result represents a failed validation or not.
 *
 * @alias module:validateParams.Result#fail
 * @returns {boolean}
 * @since version 1.1.1
 */
validateParams.Result.prototype.fail = function(){
    if(typeof this._errors === 'undefined') return false;
    return this.numErrors() > 0;
};

/**
 * An alias for [.fail()]{@link module:validateParams.Result#fail}.
 *
 * @alias module:validateParams.Result#failed
 * @see module:validateParams.Result#fail
 * @since version 1.1.1
 */
validateParams.Result.prototype.failed = validateParams.Result.prototype.fail;

/**
 * A function to return a very short summary of the result as a string, e.g.
 * 'passed', or 'failed with 2 errors'.
 *
 * @alias module:validateParams.Result#asString
 * @returns {string}
 * @since version 1.1.1
 */
validateParams.Result.prototype.asString = function(){
    if(this.pass()) return 'passed';
    var numErr = this.numErrors();
    return 'failed with ' + numErr + ' error' + (numErr > 1 ? 's' : '');
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
 * @see https://stackoverflow.com/a/29924715/174985
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
 * A function to test if a give item is a numeric value, i.e. a number or a
 * number as a string. Note that `NaN` is not considered numeric.
 *
 * @param {*} item - the item to test.
 * @returns {boolean} `true` if the item is numeric, `false` otherwise
 * @since version 1.1.1
 * @example
 * validateParams.isNumeric(undefined); // false
 * validateParams.isNumeric(null); // false
 * validateParams.isNumeric(NaN); // false
 * validateParams.isNumeric({a: 'b'}); // false
 * validateParams.isNumeric([1, '2']); // false
 * validateParams.isNumeric(0); // true
 * validateParams.isNumeric(-42); // true
 * validateParams.isNumeric(3.1415); // true
 * validateParams.isNumeric('-42'); // true
 * validateParams.isNumeric('0'); // true
 * validateParams.isNumeric('3.1415'); // true
 */
validateParams.isNumeric = function(item){
    // short-circuit numbers, NaN & non-strings
    if(typeof item === 'number' ) return isNaN(item) ? false : true;
    if(typeof item !== 'string') return false;
    
    // test if the string is a string representation of a number
    return String(Number(item)) === item;
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
 * An alias for the [validate.extend()]{@link external:extend} function from
 * validate.js.
 *
 * @alias module:validateParams.extendObject
 * @function
 * @see external:extend
 * @since version 1.1.1
 */
validateParams.extendObject = validate.extend;

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

/**
 * A helper function to find the custom message with the highest priority for a
 * validator.
 *
 * The highest priority is given to a message passed via the options, next,
 * a message defined in the validator's `message` property, and finally, a
 * message defined in the validator's `options` object.
 *
 * This function does not throw errors, it simply ignores invalid data.
 *
 * @alias module:validateParams._extractCustomValidatorMessage
 * @param {function} validator - a reference to the validator to extract the
 * message from.
 * @param {object} options - the options value passed to the validator function.
 * @returns {string} - if a custom message is found, it is returned, if not, an
 * empty string is returned.
 */
validateParams._extractCustomValidatorMessage = function(validator, options){
    var ans = '';
    if(validate.isObject(validator)){
        if(validate.isObject(validator.options) && validate.isString(validator.options.message)){
            ans = validator.options.message;
        }
        if(validate.isString(validator.message)){
            ans = validator.message;
        }
    }
    if(validate.isObject(options) && validate.isString(options.message)){
        ans = options.message;
    }
    return ans;
}

//
//=== Custom Validators ========================================================
//

/**
 * Custom validate.js validators.
 *
 * These validators are automatically registered with the instance of
 * validate.js loaded by this module. They can be loaded into another instance
 * with the
 * [validateParams.registerValidators()]{@link module:validateParams.registerValidators}
 * function.
 *
 * These validators all follow the conventions outlined in the validate.js
 * documentation.
 *
 * Custom messages can be added in two ways, a permenent custom default message
 * can be set by adding a string to the function object as a property named
 * `message`. For example, we can add a custom default message to the
 * `isInstanceof` validator like so:
 *
 * ```
 * validateParams.validators.isInstanceof.message = 'unacceptable prototype!';
 * ```
 *
 * Custom error messages can also be added when using a validator in a parameter
 * constraint by using an object for the value assigned to the validator, and
 * adding a string named `message`. For example the following parameter
 * constraint specifies a custom message for the `isInstanceof` validator:
 *
 * ```
 * {
 *     presence: true;
 *     isInstanceOf: {
 *         prototypes: ['Date'],
 *         message: 'must be a standard JavaScript Date object'
 *     }
 * }
 * ```
 *
 * Custom default values can be set for all options supported by any of these
 * validators by adding a plain object containing your defaults to the validator
 * function object as a property named `options`. For example, the following
 * code would default the `hasTypeof` validator to always rejecting `undefuned`:
 *
 * ```
 * validateParams.validators.hasTypeof.options = {notUndefined: true};
 * ```
 *
 * Note that setting an option in this way will remove all previously set
 * options. A safer way to add a default value is to use the
 * [validateParams.extendObject()]{@link module:validateParams.extendObject}
 * function:
 *
 * ```
 * var v = validateParams.validators.hasTypeof; // use var to shorten next line
 * v.options = validateParams.extendObject({notUndefined: true}, v.options);
 * ```
 *
 * Because validate.js was designed to valdiate web forms, it uses a very fuzzy
 * definition of undefinedness for its `presence` validator, specifically, the
 * function [validate.isEmpty()]{@link external:isEmpty}. All the standard
 * validators that ship with validate.js implicitly pass any value that
 * meets this permissive definition of undefinedness.
 *
 * Because validateParams.js is designed around validating function parameters,
 * validate.js's permissive approach to undefinedness doesn't make sense. Hence,
 * all the custom validators provided by this module take a different approach.
 *
 * All the custom validators defined by this module with the exception of
 * `defined` implicitly pass `undefined` values, but do not implicitly pass
 * values that pass [validate.isEmpty()]{@link external:isEmpty}.
 *
 * @alias module:validateParams.validators
 * @namespace
 * @see module:validateParams.registerValidators
 * @see [validate.js Custom Validators]{@link https://validatejs.org/#custom-validator}
 * @since version 0.1.1
 */
validateParams.validators = {
    /**
     * A validator for rejecting undefined values. Effectively a stricter
     * version of the `presence` validator bundled with validate.js.
     *
     * This validator supports the following options in addition to the standard
     * `message` option:
     * * `rejectUndefined` - a truthy value will reject undefined values, all
     *   all other values will accpet any value, including `undefined`.
     *
     * When used in a constraint, this validator supports the following values:
     * * A plain object specifying options.
     * * `true` - a shortcut for `{ rejectUndefined: true }`
     * 
     * @member
     * @type {Validator}
     * @see [The Presence Validator from validate.js]{@link https://validatejs.org/#validators-presence}
     * @since version 1.1.1
     * @example <caption>A single required first parameter that can have any value</caption>
     * validateParams.assert(arguments, [{defined: true}]);
     * @example <caption>A single required first parameter that can have any value with a custom message</caption>
     * validateParams.assert(arguments, [{
     *     defined: {
     *         rejectUndefined: true,
     *         message: 'is absolutely required'
     *     }
     * }]);
     */
    defined: function(value, options){
        // make sure the default options object exists
        if(typeof this.options !== 'object') this.options = {};
        
        // build up a base config from the pre-defined defaults
        var config = { rejectUndefined: true };
        config.message = validateParams._extractCustomValidatorMessage(this, options);
        
        // interpret the passed value
        if(typeof options === 'boolean'){
            // false prevents the validator from being run, so must have be true
            config.rejectUndefined = true;
        }else if(validate.isObject(options)){
            if(options.rejectUndefined) config.rejectUndefined = true;
            if(validate.isString(options.message)) config.message = options.message;
        }else{
            throw new Error('invalid options passed - must be true or a plain object');
        }
        
        // do the actual validation
        var errors = [];
        if(config.rejectUndefined && typeof value === 'undefined'){
            errors.push('cannot be undefined');
        }
        
        // return as appropriate
        if(errors.length > 0){
            return config.message ? config.message : errors;
        }
        return undefined;
    },
    
    
    /**
     * A validator for filtering values by the result of applying the `typeof`
     * operator to them.
     *
     * This validator supports the following options in addition to the standard
     * `message` option:
     * * `types` - an array of one or more types as strings
     * * `inverseMatch` - a truthy value to invert the search, accepting all
     *   types except those listed.
     *
     * When used in a constraint, this validator supports the following values:
     * * A plain object specifying options.
     * * An array of strings - a shortcut for `{ types: THE_ARRAY }`, i.e. the
     *   type must be one of the strings in the array.
     * * A string - a shortcut for `{ types: ['THE_STRING'] }`, i.e. the type 
     *   must be the given string.
     *
     * @member
     * @type {Validator}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof}
     * @example <caption>An optional first parameter that must be a callback if present</caption>
     * validateParams.assert(arguments, [{hasTypeof: 'function'}]);
     * @example <caption>A required first parameter that must be a string or a number</caption>
     * validateParams(arguments, [
     *     {
     *         defined: true,
     *         hasTypeof: ['string', 'number']
     *     }
     * ]);
     * @example <caption>An optional first parameter that can be anything but a function</caption>
     * validateParams(arguments, [{
     *     hasTypeof: {
     *         types: ['function'],
     *         inverseMatch: true
     *     }
     * }]);
     */
    hasTypeof: function(value, options){
        // implicitly pass undefined
        var valType = typeof value;
        if(valType === 'undefined') return undefined;
        
        // make sure the default options object exists
        if(typeof this.options !== 'object') this.options = {};
        
        // build up a base config from the pre-defined defaults
        var config = {};
        config.types = validate.isArray(this.options.types) ? this.options.types : [];
        config.inverseMatch = this.options.inverseMatch ? true : false;
        config.message = validateParams._extractCustomValidatorMessage(this, options);
        
        // interpret the passed value
        if(typeof options === 'string'){
            config.types.push(options);
        }else if(validate.isArray(options)){
            config.types = config.types.concat(options);
        }else if(validate.isObject(options)){
            if(validate.isArray(options.types)){
                config.types = config.types.concat(options.types);
            }
            if(options.inverseMatch) config.inverseMatch = true;
            if(validate.isString(options.message)) config.message = options.message;
        }else{
            throw new Error('invalid options passed - must be a string, an array of strings, or a plain object');
        }
        
        // validate the passed types
        var typeList = [];
        config.types.forEach(function(t){
            if(validateParams.isTypeofString(t) && t !== 'undefined'){
                typeList.push(t);
            }else{
                validateParams._warn('ignoring invalid type: ' + String(t));
            }
        });
        if(typeList.length === 0){
            throw new Error('no valid types specified');
        }
        
        // do the actual validation
        var errors = [];
        if(config.inverseMatch){
            // do a reverse match
            typeList.forEach(function(t){
                if(valType === t){
                    errors.push("can't have type '" + t + "'");
                }
            });
        }else{
            // do a regular forward match
            var matched = false;
            typeList.forEach(function(t){
                if(valType === t){
                    matched = true;
                }
            });
            if(!matched){
                errors.push("must have one of the following types: " + humanJoin(typeList) + "'");
            }
        }
        
        // return as appropriate
        if(errors.length > 0){
            return config.message ? config.message : errors;
        }
        return undefined;
    },
    
    /**
     * A validator for filtering values by testing them against a given
     * prototype or prototypes with the `instanceof` operator. This validator
     * will only ever pass `undefined` and values for which the
     * [validate.isObject()]{@link external:isObject} function from validate.js
     * returns `true`.
     *
     * This validator supports the following options in addition to the standard
     * `message` option:
     * * `prototypes` - an array of one or more prototypes
     * * `inverseMatch` - a truthy value to invert the search, accepting only
     *   objects that don't have any of the specified prototypes.
     *
     * When used in a constraint, this validator supports the following values:
     * * A plain object specifying options.
     * * An array of prototypes - a shortcut for `{ prototypes: THE_ARRAY }`.
     * * The value `true` - a shortcut for
     *   `{ prototypes: [Object], inverseMatch:true }`
     *
     * @member
     * @type {Validator}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof}
     * @see external:isObject
     * @example <caption>An optional first parameter that can be any object</caption>
     * validateParams.assert(arguments, [{isInstanceof: true}]);
     * @example <caption>An required first parameter that can be any error</caption>
     * validateParams.assert(arguments, [{
     *     defined: true,
     *     isInstanceof: [Error]
     * }]);
     * @example <caption>An optional first parameter that can be any error or a Date</caption>
     * validateParams.assert(arguments, [{isInstanceof: [Error, Date]}]);
     * @example <caption>A required first parameter that can be any  object other than an Error</caption>
     * // an optional first parameter than can be an object of any prototype
     * validateParams.assert(arguments, [{
     *     defined: true,
     *     isInstanceof: {
     *         prototypes: [ Error ],
     *         inverseMatch: true
     *     }
     * }]); 
     */
    isInstanceof: function(value, options){
        // implicitly pass undefined
        if(typeof value === 'undefined') return undefined;
        
        // make sure the default options object exists
        if(typeof this.options !== 'object') this.options = {};
        
        // build up a base config from the pre-defined defaults
        var config = {};
        config.prototypes = validate.isArray(this.options.prototypes) ? this.options.prototypes : [];
        config.inverseMatch = this.options.inverseMatch ? true : false;
        config.message = validateParams._extractCustomValidatorMessage(this, options);
        
        // interpret the passed value
        if(typeof options === 'boolean'){
            // false prevents a validator from running, so the value must be true
            config.prototypes.push(Object);
        }else if(validate.isArray(options)){
            config.prototypes = config.prototypes.concat(options);
        }else if(validate.isObject(options)){
            if(validate.isArray(options.prototypes)){
                config.prototypes = config.prototypes.concat(options.prototypes);
            }
            if(options.inverseMatch) config.inverseMatch = true;
            if(validate.isString(options.message)) config.message = options.message;
        }else{
            throw new Error('invalid options passed - must be true, an array, or a plain object');
        }
        
        // validate the passed prototypes
        var prototypeList = [];
        config.prototypes.forEach(function(p){
            if(typeof p === 'function'){
                prototypeList.push(p);
            }else{
                validateParams._warn('ignoring invalid prototype: ' + String(p));
            }
        });
        if(prototypeList.length === 0){
            throw new Error('no valid prototypes specified');
        }
        
        // do the actual validation
        var errors = [];
        if(config.inverseMatch){
            // do a reverse match
            prototypeList.forEach(function(p){
                if(value instanceof p){
                    errors.push("can't have prototype " + String(p));
                }
            });
        }else{
            // do a regular forward match
            var matched = false;
            prototypeList.forEach(function(p){
                if(value instanceof p){
                    matched = true;
                }
            });
            if(!matched){
                errors.push("must have one of the following prototypes: " + humanJoin(prototypeList) + "'");
            }
        }
        
        // return as appropriate
        if(errors.length > 0){
            return config.message ? config.message : errors;
        }
        return undefined;
    },
    
    /**
     * A validator for collections of key-value pairs like object literals. For
     * a value to pass this validator is must evaluate to `true` when passed to
     * the [validate.isObject()]{@link external:isObject} function from
     * validate.js.
     *
     * This validator supports the following options in addition to the standard
     * `message` option:
     * * `plainObjectOnly` - must evaluate to `true` when passed to the
     *   [valdiateParams.isPlainObject()]{@link module:validateParams.isPlainObject}
     *   function. Defaults to `false`.
     * * `keyConstraints` - a plain object defining constraints to be applied to
     *   the keys in the dictionary. Each key in the dictionary will be tested
     *   against the given constraints using the
     *   [validate.single()]{@link external:single} function from validate.js.
     * * `valueConstraints` - a plain object defining constraints to be
     *   applied to the values in the dictionary. This option cannot be set on
     *   the validator's global `options` object, and will be ignored if this
     *   validator is directly used by the [validate()]{@link external:validate}
     *   function from validate.js.
     * * `mapConstraints` - a plain object defining constraints for specific
     *   keys within the object. Defaults to an empty object. This option cannot
     *   be set on the validator's global `options` object, and will be ignored
     *   if this validator is directly used by the
     *   [validate()]{@link external:validate} function from validate.js.
     * * `rejectUnspecifiedKeys` - whether or not reject objects which contain
     *   keys not included in the `mapConstraints` option. Defaults to `false`.
     * * `sizeIs` - the exact number of key-value pairs the dictionary must
     *   contain. The passed value will be converted to a number with
     *   `parseInt()`, and if that conversion results in `NaN`, the option will
     *   be ignored.
     * * `minimumSize` - the minimum number of key-value pairs the dictionary
     *   may contain. The passed value will be converted to a number with
     *   `parseInt()`, and if that conversion results in `NaN`, the option will
     *   be ignored.
     * * `maximumSize` - the maximum number of key-value pairs the dictionary
     *   may contain. The passed value will be converted to a number with
     *   `parseInt()`, and if that conversion results in `NaN`, the option will
     *   be ignored.
     *
     * Note that if a validator appears in both `valueConstraints` and a
     * constraint for a specific key in `mapConstraints`, the definition in
     * `mapConstraints` takes precedence. No attempt is made to merge or
     * reconcile the validator options.
     *
     * Also note that if `maximumSize` is less than `minimumSize`, the validator
     * will internally swap the values before checking the size is within range.
     *   
     * When used in a constraint, this validator supports the following values:
     * * A plain object specifying options.
     * * The value `true` - a shortcut for
     *   `{ dictionary: { plainObjectOnly: true } }`.
     *
     * @member
     * @type {Validator}
     * @see external:isObject
     * @since version 1.1.1
     */
    dictionary: function(value, options){
        // NOTE - the nesting is taken care of by validateParams.validate()
        // so the valueConstraints and mapConstraints options don't need to be
        // applied here
        
        // implicitly pass undefined
        if(typeof value === 'undefined') return undefined;
        
        // make sure the default options object exists
        if(typeof this.options !== 'object') this.options = {};
        
        // build up a base config from the pre-defined defaults
        var config = {};
        config.plainObjectOnly = this.options.plainObjectOnly ? true : false;
        config.keyConstraints = validateParams.extendObject({}, this.options.keyConstraints);
        config.rejectUnspecifiedKeys = this.options.rejectUnspecifiedKeys ? true : false;
        config.sizeIs = parseInt(this.options.sizeIs); // NaN means ignore this option
        config.minimumSize = parseInt(this.options.minimumSize); // NaN means ignore this option
        config.maximumSize = parseInt(this.options.maximumSize); // NaN means ignore this option
        config.message = validateParams._extractCustomValidatorMessage(this, options);
        
        // interpret the passed value
        if(typeof options === 'boolean'){
            config.plainObjectOnly = true;
        }else if(validate.isObject(options)){
            if(options.plainObjectOnly) config.plainObjectOnly = true;
            if(validate.isObject(options.keyConstraints)){
                Object.keys(options.keyConstraints).forEach(function(vn){
                    config.keyConstraints[vn] = options.keyConstraints[vn]; // overides conflicting global validations intentionally
                });
            }
            if(options.rejectUnspecifiedKeys) config.rejectUnspecifiedKeys = true;
            if(!isNaN(parseInt(options.sizeIs))) config.sizeIs = parseInt(options.sizeIs);
            if(!isNaN(parseInt(options.minimumSize))) config.minimumSize = parseInt(options.minimumSize);
            if(!isNaN(parseInt(options.maximumSize))) config.maximumSize = parseInt(options.maximumSize);
            if(validate.isString(options.message)) config.message = options.message;
        }else{
            throw new Error('invalid options passed - must be true or a plain object');
        }
        
        // flip the size bounds if needed
        if(!(isNaN(config.minimumSize) || isNaN(config.maximumSize))){
            if(config.maximumSize < config.minimumSize){
                var trueMin = config.maximumSize;
                var trueMax = config.minimumSize;
                config.maximumSize = trueMax;
                config.minimumSize = trueMin;
            }
        }
        
        // implicitly reject non-objects
        if(!validate.isObject(value)){
            return config.message ? config.message : 'must be an object';
        }
        
        var errors = [];
        
        // deal with plainObjectOnly option
        if(config.plainObjectOnly && !validateParams.isPlainObject(value)){
            errors.push('must be a plain object');
        }
        
        // deal with the key restrictions
        Object.keys(value).forEach(function(k){
            var svRes = validate.single(k, config.keyConstraints);
            if(svRes){ // undefined means no error, so a truthy value means an error
                if(validate.isArray(svRes) && svRes.length === 1){
                    errors.push("key name '" + k + "' " + svRes[0]);
                }else{
                    errors.push("key name '" + k + "' is invalid");
                }
            }
        });
        
        // deal with rejectUnspecifiedKeys option
        if(config.rejectUnspecifiedKeys){
            var allowedKeysLookup = {};
            if(validate.isObject(options.mapConstraints)){
                Object.keys(options.mapConstraints).forEach(function(sk){
                    allowedKeysLookup[sk] = true;
                });
            }else{
                validateParams._warn('dictionary validator called with only specified keys allowed but with no keys specified in mapConstraints');
            }
            Object.keys(value).forEach(function(vk){
                if(!allowedKeysLookup[vk]) errors.push("key '" + vk + "' is not permitted");
            });
        }
        
        // deal with any specified size restrictions
        var numKeys = Object.keys(value).length;
        if(!isNaN(config.sizeIs) && numKeys !== config.sizeIs){
            errors.push('must contain ' + config.sizeIs + ' key-value pairs, but contains ' + numKeys);
        }
        if(!isNaN(config.minimumSize) && numKeys < config.minimumSize){
            errors.push('must contain at least ' + config.minimumSize + ' key-value pairs, but only contains ' + numKeys);
        }
        if(!isNaN(config.maximumSize) && numKeys > config.maximumSize){
            errors.push('may not contain more than ' + config.maximumSize + ' key-value pairs, but contains ' + numKeys);
        }
        
        // retrun as appropraite
        if(errors.length > 0){
            return config.message ? config.message : errors;
        }
        return undefined;
    },
    
    /**
     * A validator for list-like collections of values, speficially, arrays and
     * arguments objects. For a value to pass this validator is must evaluate to
     * `true` when passed to either the
     * [validate.isArray()]{@link external:isArray} function from validate.js,
     * or the
     * [validateParams.isArguments()]{@link module:validateParams.isArguments}
     * function.
     *
     * This validator supports the following options in addition to the standard
     * `message` option:
     * * `arrayOnly` - must evaluate to `true` when passed to the
     *   [valdiate.isArray()]{@link external:isArray} function from validate.js.
     *   Defaults to `false`.
     * * `valueConstraints` - a plain object defining constraints to be
     *   applied to each of the values in the list. This option cannot be set on
     *   the validator's global `options` object, and will be ignored if this
     *   validator is directly used by the [validate()]{@link external:validate}
     *   function from validate.js.
     * * `lengthIs` - the exact length the list must be. The passed value will
     *   be converted to a number with `parseInt()`, and if that conversion
     *   results in `NaN`, the option will be ignored.
     * * `minimumLength` - a minimum length for the list. The passed value will
     *   be converted to a number with `parseInt()`, and if that conversion
     *   results in `NaN`, the option will be ignored.
     * * `maximumLength` - a maximum length for the list. The passed value will
     *   be converted to a number with `parseInt()`, and if that conversion
     *   results in `NaN`, the option willbe ignored.
     *
     * Note that if `maximumLength` is less than `minimumLength`, the validator
     * will internally swap the values before checking if the length is within
     * range.
     *   
     * When used in a constraint, this validator supports the following values:
     * * A plain object specifying options.
     * * The value `true` - a shortcut for `{ list: { arrayOnly: true } }`.
     * 
     * @member
     * @type {Validator}
     * @see external:isArray
     * @see module:validateParams.isArguments
     * @since version 1.1.1
     */
    list: function(value, options){
        // NOTE - the nesting is taken care of by validateParams.validate()
        // so the valueConstraints don't need to be applied here
        
        // implicitly pass undefined
        if(typeof value === 'undefined') return undefined;
        
        // make sure the default options object exists
        if(typeof this.options !== 'object') this.options = {};
        
        // build up a base config from the pre-defined defaults
        var config = {};
        config.arrayOnly = this.options.arrayOnly ? true : false;
        config.lengthIs = parseInt(this.options.lengthIs); // NaN means ignore this option
        config.minimumLength = parseInt(this.options.minimumLength); // NaN means ignore this option
        config.maximumLength = parseInt(this.options.maximumLength); // NaN means ignore this option
        config.message = validateParams._extractCustomValidatorMessage(this, options);
        
        // interpret the passed value
        if(typeof options === 'boolean'){
            config.arrayOnly = true;
        }else if(validate.isObject(options)){
            if(options.arrayOnly) config.arrayOnly = true;
            if(!isNaN(parseInt(options.lengthIs))) config.lengthIs = parseInt(options.lengthIs);
            if(!isNaN(parseInt(options.minimumLength))) config.minimumLength = parseInt(options.minimumLength);
            if(!isNaN(parseInt(options.maximumLength))) config.maximumLength = parseInt(options.maximumLength);
            if(validate.isString(options.message)) config.message = options.message;
        }else{
            throw new Error('invalid options passed - must be true or a plain object');
        }
        
        // flip the size bounds if needed
        if(!(isNaN(config.minimumLength) || isNaN(config.maximumLength))){
            if(config.maximumLength < config.minimumLength){
                var trueMin = config.maximumLength;
                var trueMax = config.minimumLength;
                config.maximumLength = trueMax;
                config.minimumLength = trueMin;
            }
        }
        
        // implicitly reject non-lists
        if(!(validate.isArray(value) || validateParams.isArguments(value))){
            return config.message ? config.message : 'must be an array or an arguments object';
        }
        
        var errors = [];
        
        // deal with arrayOnly option
        if(config.arrayOnly && !validate.isArray(value)){
            errors.push('must be an array');
        }
        
        // deal with any specified length restrictions
        var arrLen = value.length;
        if(!isNaN(config.lengthIs) && arrLen !== config.lengthIs){
            errors.push('must have length of ' + config.lengthIs + ', but length is ' + arrLen);
        }
        if(!isNaN(config.minimumLength) && arrLen < config.minimumLength){
            errors.push('must have length of at least ' + config.minimumLength + ', but length is ' + arrLen);
        }
        if(!isNaN(config.maximumLength) && arrLen > config.maximumLength){
            errors.push('cannot have length greater than ' + config.maximumLength + ', but length is ' + arrLen);
        }
        
        // retrun as appropraite
        if(errors.length > 0){
            return config.message ? config.message : errors;
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