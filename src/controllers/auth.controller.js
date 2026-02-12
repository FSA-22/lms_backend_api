import { registerUser, loginUser } from "../services/auth.service.js";

export const registerTenant = async (req, res, next) => {
  try {
    const user = await registerUser(req.body, "TENANT");
    res.status(201).json({ message: "Tenant registered", user });
  } catch (err) {
    next(err);
  }
};

export const registerStudent = async (req, res, next) => {
  try {
    const user = await registerUser(req.body, "STUDENT");
    res.status(201).json({ message: "Student registered", user });
  } catch (err) {
    next(err);
  }
};

export const registerInstructor = async (req, res, next) => {
  try {
    const user = await registerUser(req.body, "INSTRUCTOR");
    res.status(201).json({ message: "Instructor registered", user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser(email, password);

    res.status(200).json({
      message: "Login successful",
      token: data.token,
      user: data.user,
    });
  } catch (err) {
    next(err);
  }
};
