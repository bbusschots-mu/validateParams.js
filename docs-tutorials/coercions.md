A coercion is a function which transforms a value who's meaning is clear, but
is somehow in and undesirable format into the desired format. For exaple, the
number `0` could be coerced to `false` if a boolean value was desired.

This module provides support for parameter coercion functions through the
parameter-specific option `coerce`. Custom coercions can be specied using
callbacks (see {@link CoercionCallback}), and the module provides a small
collection built-in coercions which can be specified by name (see the
[validateParams.coercions]{@link module:validateParams.coercions} name space).

The coercion per-parameter option understands three possible values:

1. A string - will be interpreted as the name of a built-in coercion.
1. A callback.
1. An object indexed by:
   * `fn` - a string or a callback interpreted as above
   * `options` - an object which will be passed to the coercion function as the
     second parameter.
     
Like default values, coercions are applied directly to the parameter list, not
to coppies of the values in the parameter list:

```
var l = [42];
validateParams(l, [{vpopt_coerce: 'toString'}]);
console.log(l[0], typeof l[0]); // logs: 42 string
```

If you plan on applying coercions to JavaScript's special `arguments` variable,
please read {@tutorial argumentsNote}.

## Suppressing Coercions

Coercions can be suppressed by setting the validation option `coerce` to
`false`. This can be useful if you wish to re-use the same constraint in
multiple validations, and don't always wish to apply coercions:

```
var tlaCons = {
  paramOptions: {
    name: 'tla',
    coerce: function(v, opts, c){ return c.toString(v).toUpperCase(); }
  },
  length: { is: 3 },
  hasTypeof: 'string',
  format: /[A-Z]{3}/
};

// A function which validates with coercions
function printTLA(){
  var args = validateParams.assert(arguments, [tlaCons]);
  console.log(args.tla);
}

// a function which validates without coercions
function isTLA(){
  return validateParams.validate(arguments, [tlaCons], { coerce: false }).passed();
}

printTLA('lol'); // logs 'LOL'
console.log(isTLA('lol')); // logs 'false'
```