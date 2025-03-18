import { z } from "zod";

export const UserCreateDTOSchema = z.object({
  authUserId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const UserUpdateDTOSchema = UserCreateDTOSchema.omit({
  authUserId: true,
}).partial();
