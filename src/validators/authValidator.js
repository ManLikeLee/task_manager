const { z } = require("zod");

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long.")
    .max(100, "Name must be 100 characters or fewer."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters long.")
    .max(30, "Username must be 30 characters or fewer.")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username can only contain lowercase letters, numbers, underscores, and hyphens.",
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password must be 128 characters or fewer."),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email is required."),
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password must be 128 characters or fewer."),
});

module.exports = {
  registerSchema,
  loginSchema,
};
