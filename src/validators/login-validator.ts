import { checkSchema } from 'express-validator'

export default checkSchema({
    email: {
        trim: true,
        errorMessage: 'Email is required!',
        notEmpty: true,
        isEmail: {
            errorMessage: 'Email should be a valid email',
        },
    },
    // firstName: {
    //     errorMessage: 'First name is required!',
    //     notEmpty: true,
    //     trim: true,
    // },
    // lastName: {
    //     errorMessage: 'Last name is required!',
    //     notEmpty: true,
    //     trim: true,
    // },
    password: {
        trim: true,
        errorMessage: 'Password is required!',
        notEmpty: true,
    },
})
