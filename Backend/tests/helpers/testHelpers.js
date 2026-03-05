import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/user.model.js";
import { jest } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";


export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "test-secret", {
    expiresIn: "7d",
  });
};
export const createTestUser = async (overrides = {}) => {
  const random = uuidv4().split("-")[0];
  const password = overrides.password || "TestPass123";
  const hashedPassword = await bcrypt.hash(password, 10);

  // Remove password from overrides to ensure it doesn't overwrite hashedPassword
  const { password: _, ...otherOverrides } = overrides;

  const defaultUser = {
    username: `testuser_${random}`,
    email: `test_${random}@example.com`,
    password: hashedPassword,
    fullName: "Test User",
    role: "government_policy_maker",
    isVerified: true,
    isActive: true,
    ...otherOverrides,
  };

  return await User.create(defaultUser);
};

export const createMockReq = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    user: null,
    headers: {},
    ...overrides,
  };
};

export const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = () => jest.fn();
