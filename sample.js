const validateParams = require('./');

function adder(n1, n2){
    var errors = validateParams(arguments, [
        {
            presence: true,
            numericality: true
        },
        {
            presence: true,
            numericality: true
        }
    ], { format: 'detailed' });
    console.log(errors);
}

adder();