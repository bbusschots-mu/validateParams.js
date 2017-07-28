When a parameter is a list or a dictionary, constraints can be specified on the
members of that list or dictionary as well as on the parameter itself. Nesting
is supported arbitarily far down, so you can specify that you wany a 2D array
of objects each indexed by two-letter keys, and each mapping to a number.

Support for nesting is provided via validator options supported on two build-in
validators, `list` and `dictionary` - see the
[validateParams.validators]{@link module:validateParams.validators} namespace.

## Validating Every Element in a List or Dictionary

The simplest nested constraints are those which specify that all items within
a list or a dictionary pass a given set of validation. For example, require an
array if numbers, or an object who's values are all strings. This is what the
`valueConstraints` option provides.

For example, the following function requires the first parameter be an array
of numbers:

```
function sumList(nums){
  validateParams.assert(arguments, [{
    defined: true,
    list: {
      valueConstraints: { hasTypeof: 'number' }
    }
  }]);
  var ans = 0;
  nums.forEach(function(n){
    ans += n;
  });
  return ans;
}
```

Similarly, the following function requires the first argument to be a plain
object containing only instances of the `Date` prototype:

```
function printDates(dates){
  validateParams.assert(arguments, [{
    defined: true,
    dictionary: {
      valueConstraints: { isInstanceof: [Date] }
    }
  }]);
  Object.keys(dates).forEach(function(dateName){
    console.log(dateName + ': ' + dates[dateName].toString());
  });
}
```

## Validating the Keys in a Dictionary

Since dictionaries are key-value pairs, it makes sense to be able to validate
they keys as well as the values. This functionality is provided via the
`dictionary` validator's `keyConstraints` option.

For example, the following function requires that the first parameter be a
dictionary which maps three-letter acronyms to strings:

```
function printTLAs(TLAs){
  validateParams.assert(arguments, [{
    defined: true,
    dictionary: {
      keyConstraints: { format: /[A-Z]{3}/ },
      valueConstraints: {
        length: { minimum: 1 },
        hasTypeof: 'string'
      }
    }
  }]);
  Object.keys(TLAs).forEach(function(TLA){
    console.log(TLA + ': ' + TLAs[TLA]);
  });
}
```

## Validating Specific Name-Value Pairs in a Dictionary

When dictionaries are used for things like passing options to a function, then
different constraints will need to be applied to different keys, and some keys
may not be optional.

Support for specifying separate constraints on different keys is provided via
`dictionary` validator's `mapConstraints` option. Keys can be marked as required
using either the `presence` or `defined` validators. The `rejectUnspecifiedKeys`
option can be used to allow only keys for which a definition exists in the
`mapConstraints` option.

For example, the following function requires it be passed an object of numbers
indexed by x and y, and allows an optional z key, but no other keys:

```
function renderCoord(c){
  validateParams.assert(arguments, [{
    defined: true,
    dictionary: {
      valueConstraints: { numericality: true }, // all the values should be numbers
      mapConstraints: {
        x: { presence: true }, // required
        y: { presence: true }, // required
        z: {} // permitted but no constraints beyond the valueConstraints
      },
      rejectUnspecifiedKeys: true // do not allow keys other than x, y, or z
    }
  }]);
  var ans = '(' + c.x + ', ' + c.y;
  if(validateParams.isNumeric(c.z)){
    ans += ', ' + c.z;
  }
  ans += ')';
  return ans;
}
```

Note the `valueConstraints` are applied to all the values as well as the
key-specific constraints specified in the `mapConstraints` option. If the same
validator is used in both `valueConstraints` and `mapConstraints`, the value
from `mapConstraints` takes precedence.

## Deep Nesting Example

The constraints within any of the `valueConstraints`, `keyConstraints` or
`mapConstraints` options to either of the `list` or `dictionary` validators can
contain `list` or `dictionary` validators which themselves specify any of the
`valueConstraints`, `keyConstraints` or `mapConstraints` options. This allows
arbitarily deep nesting of constraints.

For example, the following function requires a list of coordinates, where each
coordinate is a plain object of numbers indexed by x, y, and optionally z:

```
function renderCoordList(coordArray){
  validateParams.assert(arguments, [{
    defined: true,
    list: {
      valueConstraints: {
        dictionary: {
          valueConstraints: { numericality: true },
          mapConstraints: {
            x: { presence: true },
            y: { presence: true },
            z: {}
          },
          rejectUnspecifiedKeys: true
        }
      }
    }
  }]);
  var ans = '';
  coordArray.forEach(function(c, i){
    if(i > 0) ans += ', ';
    ans += renderCoord(c); // call function from previous example
  });
  return ans;
}
```