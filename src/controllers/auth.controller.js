import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { generateSlug } from '../utils/slugify.js';
import { generateToken } from '../utils/generateToken.js';

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

    if (!slug) {
      return res.status(400).json({ message: 'Tenant slug is required' });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // --- Find tenant ---
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, isActive: true }
    });

    if (!tenant || !tenant.isActive) {
      return res.status(404).json({
        message: 'Tenant not found or inactive'
      });
    }

    // --- Find user ---
    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: normalizedEmail
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        isActive: true,
        roles: {
          select: {
            role: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Invalid credentials or inactive account'
      });
    }

    // --- Verify password ---
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // --- Extract roles ---
    const roleNames = user.roles.map((r) => r.role.name);

    if (!roleNames.length) {
      return res.status(403).json({
        message: 'User has no assigned role'
      });
    }

    // --- Issue JWT ---
    const token = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      tenant: slug,
      roles: roleNames
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
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

// export const loginUser = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
//     const { slug, role } = req.params;

//     // --- Basic validation ---
//     if (!slug) {
//       return res.status(400).json({ message: 'Tenant slug is required' });
//     }

//     if (!role) {
//       return res.status(400).json({ message: 'Role parameter is required' });
//     }

//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     const normalizedEmail = email.toLowerCase().trim();
//     const requestedRole = role.toUpperCase().trim();

//     // --- Find tenant ---
//     const tenant = await prisma.tenant.findUnique({
//       where: { slug },
//       select: { id: true, isActive: true }
//     });

//     if (!tenant || !tenant.isActive) {
//       return res.status(404).json({
//         message: 'Tenant not found or inactive'
//       });
//     }

//     // --- Find user within tenant ---
//     const user = await prisma.user.findFirst({
//       where: {
//         email: normalizedEmail,
//         tenantId: tenant.id,
//         isActive: true
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         password: true,
//         roles: {
//           select: {
//             role: {
//               select: { name: true }
//             }
//           }
//         }
//       }
//     });

//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // --- Verify password ---
//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const roles = user.roles.map((ur) => ur.role.name.toUpperCase());

//     if (!roles.length) {
//       return res.status(403).json({
//         message: 'User has no assigned roles'
//       });
//     }

//     // --- Enforce role-based login ---
//     if (!roles.includes(requestedRole)) {
//       return res.status(403).json({
//         message: `Access denied: user is not a ${requestedRole}`
//       });
//     }

//     // --- Generate JWT with SINGLE active role ---
//     const token = generateToken({
//       userId: user.id,
//       tenantId: tenant.id,
//       tenant: slug,
//       role: requestedRole
//     });

//     return res.status(200).json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: user.id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         roles,
//         activeRole: requestedRole
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };
