import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";

// Temporary in-memory store
const users = [];

export const registerUser = async (data, role) => {
  const existingUser = users.find((u) => u.email === data.email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashed = await hashPassword(data.password);

  const user = {
    id: Date.now().toString(),
    name: data.name,
    email: data.email,
    password: hashed,
    role,
  };

  users.push(user);
  return user;
};

export const loginUser = async (email, password) => {
  const user = users.find((u) => u.email === email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  return { user, token };
};