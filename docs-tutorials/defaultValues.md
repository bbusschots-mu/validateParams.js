The validation functions provided by this module provide the ability to inject
default values for parameters with the `defaultWhenEmpty` and
`defaultWhenUndefined` per-parameter options.

Like coercions, default values are injected directly into the parameter list:

```
var l = [''];
validateParams(l, [{vpopt_defaultWhenEmpty: '?'}]);
console.log(l[0]); // logs: '?'
```

Default values are injected before any defined coercions are applied, and before
validation. Injected values will be validated, so be sure to specify a valid
default!

If the specified default value is a plain object (as determined by the
[validateParams.isPlainObject()]{@link module:validateParams.isPlainObject}
function) or an array (as determined by the
[validate.isArray()]{@link external:isArray} function from validate.js), a
shallow-copy will be created (with the
[validateParams.shallowCopy()]{@link module:validateParams:shallowCopy}
function) and used in place of the original reference.

If you plan on injecting default values into JavaScript's special `arguments`
variable, please read {@tutorial argumentsNote}.

## `defaultWhenUndefined` -v- `defaultWhenEmpty`

The `defaultWhenUndefined` parameter-specific option is used to set initial
values on parameters that are undefined, while the `defaultWhenEmpty`
parameter-specific option is used to replace the values of parameters that
are defined, but who's value evaluates to `true` via the the
[validate.isEmpty()]{@link external:isEmpty} function from validate.js.

If both options are specified, and a parameter is undefined, the
`defaultWhenUndefined` option takes precedence.

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