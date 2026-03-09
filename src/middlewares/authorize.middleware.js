export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];

    // SUPERUSER bypass
    const isSuperUser = userRoles.includes('SUPERUSER');

    if (isSuperUser) return next();

    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    next();
  };
};
