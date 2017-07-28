## Validators & Constraints

A validator is a function which takes two inputs and returns zero or more error
messages. The first input is the value to be validated, and the second is a
configuration value.

A constraint is the combination of a validator and a configuration value:

```
validator + configuration = constraint.
```

Constraints are the fundamental building blocks from which all data validations
perfromed by this module are built.

This module's concept of validators and constraints is entirely inherited from
the `validate.js` module, so you may find
[their documentation on constraints](https://validatejs.org/#constraints) to be
a helpful compliment to this tutorial.

As a practical example, let's write a validator function which tests if a given
value is a hexidecimal string. We'll follow the convention suggested in the
[documentation for validate.js](https://validatejs.org/), and have our
validator pass empty values as valid. Our validator will support two types of
configuration value:

1. The value `true` to indicate that the default options should be used.
1. A plain object defining zero or more of the following supported options:
   * `caseInsensitive` - a truthy value will allow hexidecimal numbers in
     any case to be considered valid, a falsy value will allow only upper-case
	 letters be considered valid. The default value for this option is `false`.
   * `message` - a custom error message.

```
var hexValidator = function(val, conf){
  // implicitly pass empty values
  if(validate.isEmpty(val)) return undefined;
  
  // figure out what options to use
  var opts = {};
  if(validate.isBoolean(conf)){
    opts.caseInsensitive = conf;
  }else if(validate.isObject(conf)){
    opts = conf;
	if(!validate.isDefined(opts.caseInsensitive)){
	  opts.caseInsensitive = false;
	}
  }
  if(!validate.isString(opts.message) || validate.isEmpty(opts.message)){
    opts.message = 'must be a hex string'
    if(opts.caseInsensitive){
	  opts.message += ' all in upper case';
	}
  }
  opts.re = opts.caseInsensitive ? /^[a-fA-F0-9]*$/ : /^[A-F0-9]*$/;
  
  // do the validation
  if(validate.isString(val) && val.match(opts.re)){
    return undefined; // all good so return no errors
  }
  return opts.message; // not OK so return an error message
}
```

For a validator to be usable by either the validate.js module or this module
it must be added to the plain object `validate.validators` with a name:

```
validate.validators.hexString = hexValidator;
```

Once a validator has been registred it can be used as part of a constraint.
Below is a constraint that uses our validator's default configuraiton:

```
{ hexString: true }
```

Below is a constraint that users our validator with a custom configuration:

```
{
  hexString: {
    caseInsensitive: true,
	message: 'must be a 4-character HEX string'
  }
}
```

Notice that a single validator can be used to specify many different
constraints because a constration is the combination of a validator and its
configuraiton.

## Collections of Constraints

Constraints are not designed to be used in isolation, but to be combined to
perform useful data validation.

For example, we could combine our example validator with the standard
[presence](https://validatejs.org/#validators-presence)
and [length](https://validatejs.org/#validators-length) validators included
with the `validate.js` module to built a collection of constraints describing a
required hex string 4 characters long:

```
{
  presence: true,
  length: { is: 4 },
  hexString: true
}
```

## Attribute Constraints -v- Parameter Constraints

The `validate.js` module was designed to validate web form data, which is,
by definition, composed of name-value pairs.

Throuought this module, plain objects that map collections of constraints to
names are referred to as *attribute constraints*.

For example, the following object defines constraints for two attributes, one
named `colour`, the other
`opacity`:

```
// a sample attribute constraints object
{
  colour: {
    presence: true,
	hexString: true,
	length: { is: 6 }
  },
  opacity: {
    presence: true,
	numericality: {
	  greaterThanOrEqualTo: 0,
	  lessThanOrEqualTo: 1
	}
  }
}
```

This module is not designed to validate web forms, it's designed to validate
parameter data passed to functions. Function parameters are not inherently
name-value pairs, instead, they are inherently lists.

Throughout this module, arrays of anonymous collections of constraints are
referred to as *parameter constraints*.

As an example, the following array defines constraints for two required
parameters, the first a six-digit HEX string, the second a number between
zero and one:

```
// a sample parameter constraints array
[
  { // the constraints for the first parameter
    presence: true,
	hexString: true,
	length: { is: 6 }
  },
  { // the constraints for the second parameter
    presence: true,
	numericality: {
	  greaterThanOrEqualTo: 0,
	  lessThanOrEqualTo: 1
	}
  }
]
```

Notice that at their core, both sample constaint collections above look very
similar, the only difference is that one consists of named collections of
constraints, the other, of lists of un-named collections of constraints.

## Built-in Validators

The `validate.js` module provides a number of built-in validators, and all of
those can be used with this module. You'll find details of each of these in
the [Validators section](https://validatejs.org/#validators) of the
[`validate.js` documentation](https://validatejs.org/).

This module adds a number of additional built-in validators which are
documented with the
[validateParams.validators namespeace]{@link module:validateParams.validators}.