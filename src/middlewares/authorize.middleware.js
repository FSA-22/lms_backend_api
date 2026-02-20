export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));

    if (!hasRole) return res.status(403).json({ message: 'Forbidden' });

    next();
  };
};
