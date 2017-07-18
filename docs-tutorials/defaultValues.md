The validation functions provided by this module provide the ability to inject
default values for parameters with the `defaultWhenEmpty` and
`defaultWhenUndefined` per-parameter options.

JavaScript passes objects by reference, and the default values are made directly
on the passed parameter list, so they updated values will be available after
the validation function finishes.

Default values are injected before any defined coercions are applied, and before
validation. Default values will get validated, so be sure to specify a valid
default!

#If you plan on injecting default values into JavaScript's special `arguments`
variable, please read {@tutorial argumentsNote}.

## Suppressing Injection of Defaults

The injection of default values can be suppressed by setting the validation
option `injectDefaults` to `false`. This can be useful if you wish to re-use
the same constraint in multiple validations, and don't always wish to inject
defaults:

```
var tlaCons = {
  length: { is: 3 },
  paramOptions: {
    name: 'tla',
    defaultWhenEmpty: '???'
  }
};

// A function which validates with defaults injection
function printTLA(){
  var args = validateParams.assert(arguments, [tlaCons]);
  console.log(args.tla);
}

// a function which validates without defaults injection
function isTLA(){
  return validateParams.validate(arguments, [tlaCons], { injectDefaults: false }).passed();
}

printTLA(''); // logs '???'
console.log(isTLA('')); // logs 'false' 
```