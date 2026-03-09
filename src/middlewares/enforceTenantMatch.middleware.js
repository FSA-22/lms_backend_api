export const enforceTenantMatch = (req, res, next) => {
  if (!req.user || !req.tenant) {
    return res.status(500).json({ message: 'Middleware order error' });
  }

  if (req.user.tenantId !== req.tenant.id) {
    return res.status(403).json({
      message: 'Cross-tenant access denied'
    });
  }

  next();
};
