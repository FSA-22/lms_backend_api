import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUserSession,
  logoutAllUserSessions,
} from "../services/auth.service.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validators/auth.validators.js";

export const registerTenant = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await registerUser(validated, "TENANT");

    res.status(201).json({
      success: true,
      message: "Tenant registered",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const registerStudent = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await registerUser(validated, "STUDENT");

    res.status(201).json({
      success: true,
      message: "Student registered",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const registerInstructor = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await registerUser(validated, "INSTRUCTOR");

    res.status(201).json({
      success: true,
      message: "Instructor registered",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await loginUser(validated.email, validated.password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      data: result.user,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    const result = await refreshUserSession(validated.refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      data: result.user,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    await logoutUserSession(validated.refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (err) {
    next(err);
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    await logoutAllUserSessions(req.user.id);

    res.status(200).json({
      success: true,
      message: "Logged out from all sessions",
    });
  } catch (err) {
    next(err);
  }
};
