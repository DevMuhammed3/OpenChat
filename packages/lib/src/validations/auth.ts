import { z } from "zod";

const nameMinLength = 2
const nameMaxLength = 50
const usernameMinLength = 3
const usernameMaxLength = 30
const passwordMinLength = 8

export const signupSchema = z
  .object({
    name: z.string()
      .min(nameMinLength, `Name must be at least ${nameMinLength} characters`)
      .max(nameMaxLength, `Name must be less than ${nameMaxLength} characters`),
    username: z.string()
      .min(usernameMinLength, `Username must be at least ${usernameMinLength} characters`)
      .max(usernameMaxLength, `Username must be less than ${usernameMaxLength} characters`)
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z.string()
      .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters`)
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(1, "Password is required"),
});

