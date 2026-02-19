import { hashPassword, comparePassword } from "../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import crypto from "crypto";
import {
  findUserByEmail,
  findUserAuthByEmail,
  findUserById,
  createUser,
  createSession,
  findActiveSessionByTokenHash,
  revokeSessionByTokenHash,
  revokeAllSessionsForUser,
} from "../repositories/user.repository.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const getExpiryDateFromJwt = (token) => {
  const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));

  if (!decoded.exp) {
    throw new Error("Invalid refresh token expiry");
  }

  return new Date(decoded.exp * 1000);
};

export const registerUser = async (data, role) => {
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    const error = new Error("User already exists");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await createUser({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role,
  });

  return user;
};

export const loginUser = async (email, password) => {
  const user = await findUserAuthByEmail(email);

  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    id: user.id,
    role: user.role,
    type: "refresh",
  });

  await createSession({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getExpiryDateFromJwt(refreshToken),
  });

  const { password: _, ...safeUser } = user;

  return { user: safeUser, accessToken, refreshToken };
};

export const refreshUserSession = async (refreshToken) => {
  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    const error = new Error("Invalid refresh token");
    error.status = 401;
    throw error;
  }

  if (decoded.type !== "refresh" || !decoded.id) {
    const error = new Error("Invalid refresh token");
    error.status = 401;
    throw error;
  }

  const tokenHash = hashToken(refreshToken);
  const session = await findActiveSessionByTokenHash(tokenHash);

  if (!session || session.userId !== decoded.id) {
    const error = new Error("Refresh token revoked or expired");
    error.status = 401;
    throw error;
  }

  const user = await findUserById(decoded.id);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  await revokeSessionByTokenHash(tokenHash);

  const newAccessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });
  const newRefreshToken = generateRefreshToken({
    id: user.id,
    role: user.role,
    type: "refresh",
  });

  await createSession({
    userId: user.id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: getExpiryDateFromJwt(newRefreshToken),
  });

  return {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUserSession = async (refreshToken) => {
  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    const error = new Error("Invalid refresh token");
    error.status = 401;
    throw error;
  }

  if (decoded.type !== "refresh" || !decoded.id) {
    const error = new Error("Invalid refresh token");
    error.status = 401;
    throw error;
  }

  await revokeSessionByTokenHash(hashToken(refreshToken));
};

export const logoutAllUserSessions = async (userId) => {
  await revokeAllSessionsForUser(userId);
};
