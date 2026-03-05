export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('req.user.roles', req.user.roles);

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));

    if (!hasRole) return res.status(403).json({ message: 'Forbidden' });

    next();
  };
};
