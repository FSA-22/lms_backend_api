import bcrypt from 'bcryptjs';
import { NODE_ENV } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import { generateToken } from '../utils/generateToken.js';
import { hashToken } from '../utils/hashToken.js';
import crypto from 'crypto';

export const superUserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        roles: {
          some: {
            role: {
              name: 'SUPER_ADMIN'
            }
          }
        }
      },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateToken({
      userId: user.id,
      roles: ['SUPER_ADMIN']
    });

    return res.status(200).json({
      message: 'Super admin login successful',
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const registerTenant = async (req, res) => {
  const { companyName, firstName, lastName, email, password } = req.body;

  console.log(req.body);
  console.log('🔥 Tenant register hit');

  try {
    // 1. Generate slug
    let baseSlug = generateSlug(companyName);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.tenant.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
    console.log('slug:', slug);

    const result = await prisma.$transaction(async (tx) => {
      // 2. Create Tenant
      const tenant = await tx.tenant.create({
        data: { name: companyName, slug }
      });

      // 3. Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      console.log(tenant.id);
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
      if (!adminRole) {
        throw new Error('Admin role not found in database. Please run seed script first.');
      }
      await tx.UserRole.create({
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

    // 7. Issue JWT using result
    const token = generateToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      tenant: result.tenant.slug,
      role: 'ADMIN'
    });

    res.status(201).json({
      message: 'Tenant registered successfully',
      slug: result.tenant.slug,
      token
    });

    console.log('result:', result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const registerInstructor = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const { slug } = req.params;

    // Validate slug
    if (!slug) {
      return res.status(400).json({ message: 'Tenant slug is required' });
    }

    // Validate body
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check duplicate (tenant scoped)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: tenant.id
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists in this tenant' });
    }

    // Get instructor role once
    const instructorRole = await prisma.role.findUnique({
      where: { name: 'INSTRUCTOR' },
      select: { id: true }
    });

    if (!instructorRole) {
      return res.status(500).json({ message: 'Instructor role not configured' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      const instructor = await tx.user.create({
        data: {
          tenantId: tenant.id,
          firstName,
          lastName,
          email: normalizedEmail,
          password: hashedPassword
        }
      });

      await tx.userRole.create({
        data: {
          userId: instructor.id,
          roleId: instructorRole.id
        }
      });

      return instructor;
    });

    return res.status(201).json({
      message: 'Instructor registered successfully',
      instructor: result
    });
  } catch (error) {
    next(error);
  }
};

export const registerStudent = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const { slug } = req.params;

    // Validate slug first
    if (!slug) {
      return res.status(400).json({ message: 'Tenant slug is required' });
    }

    // Validate body
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check duplicate user (tenant-scoped)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: tenant.id
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists in this tenant' });
    }

    // Get student role once
    const studentRole = await prisma.role.findUnique({
      where: { name: 'STUDENT' },
      select: { id: true }
    });

    if (!studentRole) {
      return res.status(500).json({ message: 'Student role not configured' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          firstName,
          lastName,
          email: normalizedEmail,
          password: hashedPassword
        }
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: studentRole.id
        }
      });

      return user;
    });

    return res.status(201).json({
      message: 'Student registered successfully',
      student: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { email, password } = req.body;

    if (!slug) return res.status(400).json({ message: 'Tenant slug is required' });
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const normalizedEmail = email.toLowerCase().trim();

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, isActive: true }
    });

    if (!tenant || !tenant.isActive)
      return res.status(404).json({ message: 'Tenant not found or inactive' });

    // Find user
    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: normalizedEmail } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        isActive: true,
        roles: { select: { role: { select: { name: true } } } }
      }
    });

    if (!user || !user.isActive)
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const roleNames = user.roles.map((r) => r.role.name);
    if (!roleNames.length) return res.status(403).json({ message: 'User has no assigned role' });

    // Generate access token
    const accessToken = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      tenant: slug,
      roles: roleNames
    });

    // Save refresh token in DB
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: user.id,
        tenantId: tenant.id,
        revoked: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: roleNames
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- Refresh: issue new access token using HttpOnly cookie ---
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshTokenValue = req.cookies.refreshToken;
    if (!refreshTokenValue) return res.status(401).json({ message: 'No refresh token found' });

    const hashedIncoming = hashToken(refreshTokenValue);

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token: hashedIncoming,
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!tokenRecord) return res.status(401).json({ message: 'Invalid or revoked refresh token' });

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true }
    });

    // Generate new refresh token
    const newRawToken = crypto.randomBytes(64).toString('hex');
    const newHashedToken = hashToken(newRawToken);

    await prisma.refreshToken.create({
      data: {
        token: newHashedToken,
        userId: tokenRecord.user.id,
        tenantId: tokenRecord.tenantId,
        revoked: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Replace cookie
    res.cookie('refreshToken', newRawToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tokenRecord.tenantId },
      select: { slug: true }
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const roleNames = await prisma.userRole.findMany({
      where: { userId: tokenRecord.user.id },
      select: { role: { select: { name: true } } }
    });

    // Issue new access token
    const accessToken = generateToken({
      userId: tokenRecord.user.id,
      tenantId: tokenRecord.tenantId,
      tenant: tenant.slug,
      roles: roleNames.map((r) => r.role.name)
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// --- Logout: revoke refresh token and clear cookie ---
export const logout = async (req, res) => {
  try {
    const refreshTokenValue = req.cookies.refreshToken;
    if (!refreshTokenValue) return res.status(400).json({ message: 'No refresh token found' });

    const hashedIncoming = hashToken(refreshTokenValue);

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { token: hashedIncoming, revoked: false }
    });

    if (tokenRecord) {
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true }
      });
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
