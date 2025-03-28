import { z } from "zod";

export const UserCreateDTOSchema = z.object({
  name: z.string().min(3).max(255),
  email: z.string().email(),
  password: z.string().min(6).max(255),
});

export const UserLoginDTOSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const AccessTokenDTOSchema = z.object({
  accessToken: z.string(),
});

export const EmailVerificationDTOSchema = z.object({
  email: z.string().email(),
  code: z.string(),
});
