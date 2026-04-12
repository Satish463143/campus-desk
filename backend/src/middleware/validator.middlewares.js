
const bodyValidator = (schema) => {
    return async (req, res, next) => {
        try {
            const data = req.body;
            if (req.file) {
                data[req.file.fieldname] = req.file.filename;
            }

            await schema.validateAsync(data, { abortEarly: false });
            next();
        } catch (exception) {
            const detail = {};

            // Check if Joi validation error
            if (exception.isJoi && exception.details) {
                
                // Map the validation errors to details object
                exception.details.map((error) => {
                    console.log(error);
                    detail[error["path"][0]] = error.message;
                });
            } else {
                // Handle other types of errors (e.g., unexpected errors)
                console.error(exception);
            }

            next({
                status: 400,
                details: Object.keys(detail).length > 0 ? detail : { error: 'An unknown error occurred' }
            });
        }
    };
};

module.exports = {
    bodyValidator
};
