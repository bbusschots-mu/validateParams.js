# validateParams.js (@maynoothuniversity/validate-params)

A wrapper around [validate.js](https://validatejs.org/) to facilitate easy
function parameter validation in JavaScript.

`Validate.js` is designed to valid web forms, so it expects the values to be
validated as name-value pairs, and is expects the constraints to validate those
values against to also be specified as name-value pairs. This is perfect for
web forms where each input has a name, but the model doesn't work well for
function parameters which take the form of lists of un-named values.

The two validation functions provided by this module expect both the
values to be validated and the constraints to be applied as lists (Arguments
objects or Arrays), and transform them into name-value pairs indexed by
`param1`, `param2` etc. which they then pass to the `validate()` function from
`validate.js`.

The main function, `validateParams()`, returns the result of the call to
`valiate()`, while `validateParams.assert()` throws
`validateParams.ValidationError` errors when validation fails. The
`validateParams.assert()` function does not discard the output from the call to
`validate()`, it adds it into the thrown error as a property named
`validationErrors`.

For details on constraints and options, see the
[valdiate.js documentation](https://validatejs.org/).

## Installation

### NodeJS

Install the module and its dependencies:

```
npm install '@maynoothuniversity/validate-params' --save
```

Load the module:

```
var validateParam = require('@maynoothuniversity/validate-params');
```

### Browser (CDN)

```
<!-- Import validate.js then validateParams.js -->
<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/validate.js/0.11.1/validate.min.js"></script>
<script type="text/javascript" src="https://cdn.rawgit.com/bbusschots-mu/validateParams.js/master/validateParams.js" ></script>
```

## Synopsis:

```
var errors = validateParams(parameterData, constraints, [options]);
```

or

```
validateParams.assert(parameterData, constraints, [options]); // throws on error
```

The special `arguments` variable can be passed as `parameterData`.

The optional `options` associative array is passed through to the `validate()`
function from `validate.js`.

## Example Usages

```
// a function with a required and an optional argument
function exclaim(msg, n){
    // validate the parameters
    var errors = validateParams(arguments, [
        { presence: true }, // first parameter
        { numericality: { onlyInteger: true, greaterThan: 0 } } // second
    ]); // returns value from validate.js valiate() function
    
    // respond to a validation problem with the required first parameter
    if(errors && errors.param1){
        throw new Error('first parameter is required');
    }
    
    // deal with the optional second parameter
    var numExlamations = 1;
    if(errors && errors.param2){
        console.log('invalid number of exclamations - using default value of 1');
    }else if(n){
        numExlamations = n;
    }
    
    // do some work
    var ans = msg;
    while(numExlamations > 0){
        ans += '!';
        numExlamations--;
    }
    
    // return the result
    return numExlamations;
}

// a function that always throws an error on invalid args
function repeatStr(s, n){
    // validate parameters
    validateParams.assert(arguments, [
        { // first parameter
            presence: true
        },
        { // second
            presence: true,
            numericality: { onlyInteger: true, greaterThan: 1 }
        }
    ]); // will throw validateParams.ValidationError on invalid args
    
    // do some work
    var ans = '';
    while(n > 0){
        ans += s;
        n--;
    }
    
    // return the result
    return ans;
}
```