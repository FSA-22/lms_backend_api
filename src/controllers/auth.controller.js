import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import { generateToken } from '../Utils/generateToken.js';

// export const registerTenant = async (req, res) => {
//   const { companyName, firstName, lastName, email, password } = req.body;

//   console.log(req.body);

//   console.log('🔥 Tenant register hit');

//   try {
//     const result = await prisma.$transaction(async (tx) => {
//       // 1. Generate slug
//       let baseSlug = generateSlug(companyName);
//       let slug = baseSlug;
//       let counter = 1;

//       console.log('slug:', slug);

//       while (await tx.tenant.findUnique({ where: { slug } })) {
//         counter++;
//         slug = `${baseSlug}-${counter}`;
//       }

//       // 2. Create Tenant
//       const tenant = await tx.tenant.create({
//         data: { name: companyName, slug }
//       });

//       // 3. Hash password
//       const hashedPassword = await bcrypt.hash(password, 12);

//       // 4. Create Admin User
//       const user = await tx.user.create({
//         data: {
//           tenantId: tenant.id,
//           firstName,
//           lastName,
//           email,
//           password: hashedPassword
//         }
//       });

//       // 5. Assign ADMIN role
//       const adminRole = await tx.role.findUnique({
//         where: { name: 'ADMIN' }
//       });

//       await tx.userRole.create({
//         data: {
//           userId: user.id,
//           roleId: adminRole.id
//         }
//       });

//       // 6. Attach FREE subscription
//       const freePlan = await tx.plan.findUnique({
//         where: { name: 'FREE' }
//       });

//       await tx.subscription.create({
//         data: {
//           tenantId: tenant.id,
//           planId: freePlan.id,
//           status: 'ACTIVE'
//         }
//       });

//       return { user, tenant };
//     });

//     // 7. Issue JWT
//     const token = generateToken({
//       userId: user.id,
//       tenantId: tenant.id,
//       tenant: slug,
//       role: role
//     });

//     res.status(201).json({
//       message: 'Tenant registered successfully',
//       slug: result.tenant.slug,
//       token
//     });

//     console.log('result:', result);
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ message: 'Registration failed' });
//   }
// };

export const registerTenant = async (req, res) => {
  const { companyName, firstName, lastName, email, password } = req.body;

  console.log(req.body);
  console.log('🔥 Tenant register hit');

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

export const adminLogin = async (req, res, next) => {
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
      return res
        .status(401)
        .json({ message: 'Invalid credentials or no such user in this organization' });
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
      tenant: slug,
      role: user.roles
    });

    return res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { slug, role } = req.params;

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

    //  Find user
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, tenantId: tenant.id, isActive: true },
      include: { roles: { select: { role: { select: { name: true } } } } }
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    //  Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    //  Extract role names
    const roles = user.roles.map((ur) => ur.role.name.toUpperCase());

    console.log('roles:', roles);

    // Allow only the role from URL
    const requestedRole = role.toUpperCase();

    if (!roles.includes(requestedRole)) {
      return res.status(403).json({ message: `Access denied: user is not a ${requestedRole}` });
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      tenant: slug,
      role: roles
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles
      }
    });
  } catch (error) {
    next(error);
  }
};
export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  const { slug } = req.params;

  if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

  //  Find tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

  // Ensure token belongs to user + tenant
  const tokenRecord = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      userId: req.user.userId,
      tenantId: tenant.id,
      revoked: false
    }
  });

  if (!tokenRecord) return res.status(401).json({ message: 'Invalid refresh token' });

  //  Revoke
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revoked: true }
  });

  res.json({ message: 'Logged out successfully' });
};

/**
 * Create Instructor User
 */
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

/**
 * Create Student User
 */
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
