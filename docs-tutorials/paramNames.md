At its most fundamental level, this module translates lists of data and
constraints into name-value pairs of data and contstraints as expected by the
validation functions from [validate.js](https://validatejs.org/).

Consider the following call to this module's
[vaidateParams()]{module:validateParams~validateParams} function:

```
var errs = validateParams(
  ['stuff', 42], // parameter list
  [ // constraints list
    { presence: true }, // constraints for 1st param
    { // constraints for 2nd param
      numericality: {
        onlyInteger: true,
        greaterThanOrEqualTo: 1
      }
    }
  ]
);
```

This gets translated to the following call to  the
[validate()]{@link external:validate} function from `validate.js`:

```
var errs = validate(
  { // attributes object - from parameter list
    param1: 'stuff',
    param2: 42
  },
  { // constrants object - from constraints list
    param1: { presence: true },
    param2: {
      numericality: {
        onlyInteger: true,
        greaterThanOrEqualTo: 1
      }
    }
  }
);
```

You can access the generated attributes and constraints objects if you run the
validation via the
[validateParams.validate()]{@link module:validateParams.validate} function
which returns a [validateParams.Result]{@link module:validateParams.Result}
object:

```
var res = validateParams.validate(
  ['stuff', 42],
  [
    { presence: true },
    { 
      numericality: {
        onlyInteger: true,
        greaterThanOrEqualTo: 1
      }
    }
  ]
);
console.log('the generated attributes object', res.validateAttributes());
console.log('the generated constraints object', res.validateConstraints());
```

The per-parameter option `name` can be used to customise the names.

Consider the following call to `validateParams.validate()`:

```
var res = validateParams.validate(
  ['stuff', 42],
  [
    {
      presence: true,
      vpopt_name: 'str'
    },
    { 
      numericality: {
        onlyInteger: true,
        greaterThanOrEqualTo: 1
      },
      vpopt_name: 'repeatBy'
    }
  ]
);
```

This will result in the following attributes object being generated:

```
{
  str: 'stuff',
  repeatBy: 42
}
```

And the following constraints object:

```
{
  str: { presence: true },
  repeatBy: {
    numericality: {
      onlyInteger: true,
      greaterThanOrEqualTo: 1
    }
  }
}
```

This per-paramter option is particuarlly useful when combined with one of the
data defaulting per-parameter options, or with coercion:

```
function stringRepeater(){
  var args = validateParams.assert(
    arguments,
    [
      {
        presence: true,
        paramOptions: {
          name: 'str',
          coerce: function(v){
            if(validateParams.validateJS().isEmpty(v)){
              return undefined;
            }
            return String(v); }
        }
      },
      {
        numericality: {
          onlyInteger: true,
          greaterThanOrEqualTo: 1
        },
        paramOptions: {
          name: 'n',
          defaultWhenEmpty: 1
        }
      }
    ]
  );
  
  var ans = args.str;
  while(args.n > 1){
    ans += args.str;
    args.n--;
  }
  return ans;
}
console.log(stringRepeater()); // throws validation error
console.log(stringRepeater('stuff')); // logs 'stuff'
console.log(stringRepeater('stuff', 3)); // logs 'stuffstuffstuff'
```