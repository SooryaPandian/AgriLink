const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access restricted to: ${roles.join(', ')}` });
  }
  next();
};

module.exports = { requireRole };
