import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../config/env.js";

// Generate Access Token
const generateAccessToken = (user) => {
    return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN || '15m' });
}

// Generate Refresh Token
const generateRefreshToken = (user) => {
    return jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN || '7d' });
}

export {
    generateAccessToken,
    generateRefreshToken
}