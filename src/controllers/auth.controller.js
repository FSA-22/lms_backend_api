import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import { EXPIRES_IN, JWT_SECRET } from '../config/env.js';
import { generateToken } from '../utils/generateToken.js';

export const registerTenant = async (req, res) => {
  const { companyName, firstName, lastName, email, password } = req.body;

  console.log(req.body);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate slug
      let baseSlug = generateSlug(companyName);
      let slug = baseSlug;
      let counter = 1;

      console.log('slug:', slug);

      while (await tx.tenant.findUnique({ where: { slug } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }

      // 2. Create Tenant
      const tenant = await tx.tenant.create({
        data: { name: companyName, slug }
      });

      // 3. Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // 4. Create Admin User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          firstName,
          lastName,
          email,
          password: hashedPassword
        }
      });

      // 5. Assign ADMIN role
      const adminRole = await tx.role.findUnique({
        where: { name: 'ADMIN' }
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id
        }
      });

      // 6. Attach FREE subscription
      const freePlan = await tx.plan.findUnique({
        where: { name: 'FREE' }
      });

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: freePlan.id,
          status: 'ACTIVE'
        }
      });

      return { user, tenant };
    });

    // 7. Issue JWT
    const token = jwt.sign(
      {
        userId: result.user.id,
        tenantId: result.tenant.id
      },
      JWT_SECRET,
      { expiresIn: EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Tenant registered successfully',
      slug: result.tenant.slug,
      token
    });

    console.log('result:', result);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { email, password } = req.body;

    console.log('body:', req.body);
    console.log('slug:', slug);

    if (!slug) {
      return res.status(400).json({ message: 'Tenant slug is required' });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true }
    });

    console.log('tenant:', tenant);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Find user within tenant (composite unique: email + tenantId)
    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email
        }
      },
      select: {
        id: true,
        password: true,
        isActive: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log('user:', user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    //  Issue JWT
    const token = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};
