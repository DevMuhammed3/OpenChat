import { z } from "zod";

const passwordCounter = 6
const nameCounter = 3

export const signupSchema = z
  .object({
    name: z.string().min(nameCounter, "Name must be at least 3 characters"),
    username: z.string().min(nameCounter, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(passwordCounter, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(passwordCounter, "Password must be at least 6 characters"),
});

