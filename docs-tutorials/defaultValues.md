The validation functions provided by this module provide the ability to inject
default values for parameters with the `defaultWhenEmpty` and
`defaultWhenUndefined` per-parameter options.

JavaScript passes objects by reference, and the default values are made directly
on the passed parameter list, so they updated values will be available after
the validation function finishes.

Default values are injected before any defined coercions are applied, and before
validation. Default values will get validated, so be sure to specify a valid
default!

## A Note One the `arguments` Variable

The special `arguments` variable JavaScript provides within functions is an
array-like object, so it is passed by value, and default values can be injected
into it. However, when the values inside the `arguments` object are altered, the
values associated with the corresponding parameter names do not. This can be
very confusing, as illustrated by the following sample function:

```
function huh(x){
  validateParams.assert(arguments, [{vpopt_defaultWhenEmpty: 'changed!'}]);
  return [x, arguments[0]];
}
console.log(huh('')); // logs ['', 'changed!']
```

Combining the fact that the
[validateParams.assert()]{@link module:validateParams.assert} function returns a
reference to the generated attributes data structure passed to the
[validate()]{@link external:validate} function from `validate.js` with the
`name` per-parameter option produces a useful design pattern:

```
function raiseTo(){
  var args = validateParams.assert(arguments, [
    { vpopt_name: 'base', numericality: true, presence: true },
    {
      paramOptions: {
        name: 'exponent',
        defaultWhenEmpty: 2
      },
      numericality: { onlyInteger: true, greaterThanOrEqualTo: 0 }
    }
  ]);
  
  var ans = args.base;
  while(args.exponent > 1){
    ans *= args.base;
    args.exponent--;
  }
  return ans;
}
console.log(raiseTo()); // throws validation error
console.log(raiseTo(2)); // logs '4'
console.log(raiseTo(2, 4)); // logs '16'
```

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
```