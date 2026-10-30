const containsUnsafeKey = (value) => {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsUnsafeKey);

  return Object.entries(value).some(([key, nestedValue]) =>
    key.startsWith('$') || key.includes('.') || containsUnsafeKey(nestedValue),
  );
};

const rejectMongoOperators = (req, res, next) => {
  if ([req.body, req.query, req.params].some(containsUnsafeKey)) {
    return res.status(400).json({
      success: false,
      message: 'Request contains unsupported field names',
    });
  }

  next();
};

module.exports = rejectMongoOperators;
