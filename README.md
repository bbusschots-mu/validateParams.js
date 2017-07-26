# validateParams.js (@maynoothuniversity/validate-params)

A wrapper around [validate.js](https://validatejs.org/) to facilitate easy
function parameter validation in JavaScript.

`validate.js` is designed to validate web forms.  HTML form data is
fundamentally a collection of name-value pairs, so it makes sense that the
validation functions provided by `validate.js` expect both the data to be
validated, and the constraints to be applied to that data to be specified as
collections of name-value pairs (JavaScript objects).

Function parameters are not name-value pairs, they are lists of values. Hence,
the validation functions provided by this module expect both the data to be
validated, and the constraints to be applied to that data to be specified as
lists.

Internally, the module converts the passed parameter and constraint lists to
collections of name-value pairs which it then validates with `validate.js`.

As well as translating between lists and name-value pairs, the module also
provides a number of other additional features which focus on parameter
validation, including the specification of default values, support for data
coercion, improved support for nested constraints, and a number of additional
validators.

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
// passes through the return value from validate.js
var errors = validateParams(parameterList, constraintList, [options]);
```

or

```
// returns a validateParams.Result object
var result = validateParams.validate(parameterList, constraintList, [options]);
```

```
// throws a validateParams.ValidationError if validation fails
validateParams.assert(parameterList, constraintList, [options]);
```

The `parameterList` can be an array, or, JavaScript's special `arguments`
variable.

The `constraintList` is an array of object literals, each defining one or more
`validate.js` compatible constraints.

The optional `options` parameter should be an object literal, and can be used
to specify options that alter both the behaviour of the validation functions
provided by this module, and the validation functions from `validate.js` used to
perform the actual validations.

## Example

```
// An implementation of the Factorial function
// The first argument must be present, an integer, and >= 0
function fact(n){
    // validate the parameter
    validateParams.assert(
        arguments,
        [{
            presence: true,
            numericality: {
                onlyInteger: true,
                greaterThanOrEqualTo: 0
            }
        }
    ]); // will throw validateParams.ValidationError on invalid params
    
    // do the calculation
    var ans = 1;
    while(n > 0){
        ans *= n;
        n--;
    }
    
    // return the result
    return ans;
}

var x = fact(4); // x=24
var y = fact('4'); // x=24
var z = fact('stuff'); // throws validateParams.ValidationError
```

## Documentation

* API Documentation for validateParams.js: [bbusschots-mu.github.io/...](https://bbusschots-mu.github.io/validateParams.js/)
* API Documentation for validate.js: [validatejs.org/...](https://validatejs.org/)