import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return process.env.JWT_SECRET;
};

const getRefreshJwtSecret = () => process.env.JWT_REFRESH_SECRET || getJwtSecret();

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, getRefreshJwtSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshJwtSecret());
};
