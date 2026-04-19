const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        console.error('[Validate] BODY:', JSON.stringify(req.body));
        console.error('[Validate] ERROR:', error.message, JSON.stringify(error.issues || error.errors || []));
        return res.status(400).json({
            error: 'Validation failed',
            details: error.issues || error.errors || error.message
        });
    }
};

module.exports = validate;
