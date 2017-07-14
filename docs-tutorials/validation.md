## The Validation Functions

This module provides three validation functions for three different coding
styles. Which to use will depend on the situation, and your preferences. All
three functions take the same arguments, and perform the same validations in the
same way, the difference is in how they behave when validation fails.

As this module is a wrapper for `validate.js`, the primary validation function
[validateParams()]{@link module:validateParams~validateParams} responds to
errors in the same way the [validate()]{@link external:validate} function from
`validate.js` does - it returns `undefined` if there were no errors, or
collection of one or more error strings if there were errors. The format of the
returned error data is determined by the `format` option
[as described in the validate.js documentation](https://validatejs.org/#validate-error-formatting).