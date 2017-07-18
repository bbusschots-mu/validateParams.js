The special `arguments` variable JavaScript provides within functions is an
array-like object, so it's passed by value. This means default values can be
injected into it with the per-parameter options `defaultWhenUndefined` and
`defaultWhenEmpty`, and the values it does contain can be coerced with the
`coerce` per-parameter option. However, when the values inside the `arguments`
object are altered, the values associated with the corresponding parameter names
do not get reliably updated. This can be very confusing, as illustrated by the
following sample function:

```
function huh(x){
  validateParams.assert(arguments, [{vpopt_coerce: function(){ return 'changed!'; }}]);
  return [x, arguments[0]];
}
console.log(huh('')); // may log in some browsers ['', 'changed!'], or ['changed!', 'changed!'] in others
```

Combining the fact that the
[validateParams.assert()]{@link module:validateParams.assert} function returns a
reference to the generated attributes data structure passed to the
[validate()]{@link external:validate} function from `validate.js` with the
per-parameter option `name` produces a useful design pattern for working around
this inconsistent behaviour - don't name the parameters in the function
definition, name them in the parameter list so they will get those names in the
generated attributes list, and save that to a conveniently named variable for
easy access. This design pattern is illustrated in the example below:

```
function raiseTo(){
  var args = validateParams.assert(arguments, [
    {
      paramOptions: {
        name: 'base',
        coerce: 'toNumber'
      },
      numericality: true,
      presence: true
    },
    {
      paramOptions: {
        name: 'exponent',
        defaultWhenEmpty: 2,
        coerce: 'toNumber'
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
console.log(raiseTo('2', '5')); // logs '32'
```