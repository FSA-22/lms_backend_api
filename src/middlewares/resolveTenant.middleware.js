import prisma from '../lib/prisma';

export async function resolveTenant(req, res, next) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ message: 'Tenant slug required' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    req.tenant = tenant;

    next();
  } catch (error) {
    next(error);
  }
}
