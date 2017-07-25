## The Validation Functions

This module provides three validation functions for three different coding
styles. Which to use will depend on the situation, and your preferences. All
three functions take the same arguments, and perform the same validations in the
same way, the difference is in how they behave when validation fails.

As this module is a wrapper for `validate.js`, the primary validation function
[validateParams()]{@link module:validateParams~validateParams} responds to
errors in the same way the [validate()]{@link external:validate} function from
`validate.js` does - it returns `undefined` if there were no errors, or a
collection of one or more error strings if there were errors. The format of the
returned error data is determined by the `format` option
[as described in the validate.js documentation](https://validatejs.org/#validate-error-formatting).

Because HTML forms fundamentally consist of name-value pairs, and `validate.js`
was designed to validate web forms, the validation functions provided by that
module expect the data to be validated and the constraints to be applied to be
passed as name-value pairs.

Function parameters on the other hand are lists, not name-value pairs, so the
validation functions provided by this module expect both the data to be
validated and the constraints to be applied to be specified as lists.

The following three validation functions are provided by this module:

* [validateParams()]{@link module:validateParams~validateParams} - returns the
  same values as the [validate()]{@link external:validate} function from
  `validate.js`. Specifically, `undefined` if there were no validation errors,
  or the errors generated during validation if there were. The structure of the
  returned errors is determined by the `format` option.
  
  ```
  var errs = validateParams(arguments, [{ presence: true, hasTypeof: 'number' }]);
  if(errs){
    console.log('invalid data!', errs);
  }
  ```
  
* [validateParams.validate()]{@link module:validateParams.validate} - returns a
  [validateParams.Result]{@link module:validateParams.Result} object.
  
  ```
  var res = validateParams.validate(arguments, [{ presence: true, hasTypeof: 'number' }]);
  if(res.failed()){
    console.log('invalid data!', res.errorList());
  }
  ```
  
* [validateParams.assert()]{@link module:validateParams.assert} - throws a
  [validateParams.ValidationError]{@link module:validateParams.ValidationError}
  if the data does not pass the constraints.
  
  ```
  validateParams.assert(arguments, [{ presence: true, hasTypeof: 'number' }]);
  ```

The validation functions all expect the same three parameters - the list of data
to validate, the list of constraints to validate the data against, and
optionally, an object literal of options.

### Paramter List

The first parameter expected by all three of the validation functions is the
parameter list. This should be an array, or, JavaScript's special `arguments`
variable.

### Constraints List

The second parameter expected by all three of the validation functions is the
constraints list. This should be an array of object literals, where each
object literal defines the constraints to be applied to the matching entry in
the parameter list. The constraints defined in the first entry in the
costraints list will be applied to the value in the first entry of the parameter
list, the constraints in the second entry of the constraints list to the value
in the second entry of the parameter list, and so on.

The constraints should be in the format expected by `validate.js`, that is:

```
{
  <VALIDATOR_NAME>: {
     <VALIDATOR_VALUE>
  }
  ...
}
```

For example, the following constraints list defines one constraint to be applied
to the first parameter, and two to the second:

```
[
  { // constraint for the first parameter
    defined: true, // the value for the first parameter cannot be undefined
  },
  { // constraints for the second parameter
    defined: true, // the value for the second parameter cannot be undefined
    hasTypeof: 'function' // the value must be a callback
  }
]
```

### Validation Options

All three validation functions can optionally accept a collection of options as
a third parameter. This object can contain options that control the behaviour of
both the validation functions provided this module, and, the valdiation
functions from `validate.js` that this module uses to perform the validation.

For example, the error formatting can be altered from the default grouped
formatting to a flat formatting by passing `{format: 'flat'}` as the third
parameter.

For details on the options supported by `validate.js`, see the
[validate.js documentation](https://validatejs.org/#overview).

The validation functions provided by this module support the following options:

* `coerce` - a truthy value enables the coercion feature, a falsy value disables
  it. This option defaults to `true`.
* `injectDefaults` - a truthy value enables the default value injection feature,
  and a falsy value disables it. This option defaults to `true`.
* `fatal` - a truthy value will cause the validation function to throw a
  [validateParams.ValidationError]{@link module:validateParams.ValidationError}
  if all data does not pass all constraints. This option genereally defaults to
  `false`, except when validating with the
  [validateParams.assert()]{@link module:validateParams.assert} function, which
  forces the option to `true` regardless of the value specified in the options.

## Constraints and Validators

Constraints are built up by specifying validators and the options those
validators should obey when validating the data. Each validator defines its own
rules for the options it supports.

All the validators that ship with `validate.js` are available through this
module, and this module provides a number of additional validators. You can also
create your own custom validators for use with this module.

For more information about how validators work, see the
[Validators section of the validate.js documentation](https://validatejs.org/#validators).

### Required Parameters & Presence -v- Defined

The standard validations provided by `validate.js` all implicitly pass values
that evaluate to true via the [validate.isEmpty()]{@link external:isEmpty}
function. Similarly, the validations provided by this module all implicitly pass
`undefined`.

To make a parameter required, you need to add one of two special validators:

* The [Presence Validator](https://validatejs.org/#validators-presence) from
  `validate.js`. This validator not only forces the value to be defined, but
  also to be non-empty. `null`, empty strings, empty arrays, and object literals
  with no defined attributes all fail this validator.
* The [Defined Validator]{@link module:validateParams.validators.defined}
  provided by this module. This validator is more liberal than the Presence
  Validator, only rejecting `undefined`.
  
For example, the following constraints list defines constraints for two
parameters, the first of which must be defined and not empty, while the second
must be defined:

```
[
  { presence: true }, // the first constraint
  { defined: true } // the second constraint
]
```

### Per-Parameter Options

A number of speical per-parameter options can be specified within the
constraints list. These options only effect the behaviour of the validation
functions provided by this module, and, they are not passed on to the validation
functions from `validate.js`.

Per-parameter options are name-value pairs, and there are two ways to include
them in constraints within a constraints list.

#### The Pre-fix Syntax

This syntax is most suited to adding single per-parameter option. The option is
added directly into the constraints object with its name pre-fixed with `vpopt_`
(short for validateParams Option). E.g.:

```
{
  defined: true,
  vpopt_name: 'someName'
}
```

#### The paramOptions Syntax

This syntax is most suited to adding multiple per-parameter options. The options
are not added directly to the contrainst, but inside an object named
`paramOptions` which is included in the constraint. E.g.:

```
{
  defined: true,
  hasTypeof: 'boolean',
  paramOptions: {
    name: 'someName',
    coerce: function(v){ return v ? true : false; }
  }
}
```

If the same option is specified with both syntaxes, the valued defined in
`paramOptions` will be used.

The following per-parameter options are supported:

* `name` - for altering the names parameters are given in the generated
  attributes and constraints objects - see {@tutorial paramNames}.
* `defaultWhenEmpty` & `defaultWhenUndefined` - for setting default values for
  parameters that are undefined or empty - see {@tutorial defaultValues}.

### Worked Example - Factorial Function

The factorial of a number is the product of that number and all other numbers
between it and one. So, the factorial of `4` is `4 * 3 * 2`, or `24`. The
input to the factorial function must be am integer number, and it must be
greater than or equal to zero.

This function only requires one parameter, so we only need to build one
constraints object.

In this case, the one parameter is not optional, so our constraints object
should include the
[Presence Validator](https://validatejs.org/#validators-presence) from
`validate.js`. This is a very simple validator, it simply expects to be passed
the value `true`.

```
presence: true
```

The one parameter must also be a number, so we'll also need to use the
[Numericality Validator](https://validatejs.org/#validators-numericality) from
`validate.js`. This is a more complex validator, supporting multiple options.
In this case, the value we need to specify is not simply `true`, but an object
literal that specifies the needed options to limit the number to being an
integer with a value greater than or equal to zero.

```
numericality: {
  onlyInteger: true,
  greaterThanOrEqualTo: 0
}
```

Putting it all together we get the following constraints list:

```
[{
  presence: true,
  numericality: {
    onlyInteger: true,
    greaterThanOrEqualTo: 0
  }
}]
```

Armed with this contraints list we can now write our function:

```
function factorial(n){
  validateParams.assert(
    arguments, // validate the arguments passed to the function
    [{ // the constraints list
      presence: true,
      numericality: {
        onlyInteger: true,
        greaterThanOrEqualTo: 0
      }
    }]
  ); // throws an error if validation fails
  
  var fact = 1;
  while(n > 1){
    fact *= n;
    n--;
  }
  return fact;
}
```

When we try use our function, the following happens:

```
var x = factorial(4); // x=24
var y = factorial('4'); // y=24
var e1 = factorial(); // throws error - argument not present
var e3 = factorial('stuff'); // throws error - argument is not a number
var e2 = factorial(3.14); // throws error - argument is not an integer
var e3 = factorial(-4); // throws error - argument is not >= 0
```