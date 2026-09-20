import { z } from "zod";

/** Minimum strength for a new password. Supabase enforces its own project
 *  setting on top of this (default: 6 characters); its message is surfaced
 *  as-is when the project asks for more. */
export const PASSWORD_MIN_LENGTH = 10;

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, mixing letters with numbers or symbols.`;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(72, "Keep it under 72 characters.")
  .refine((s) => /[a-zA-Z]/.test(s) && /[^a-zA-Z]/.test(s), "Mix letters with numbers or symbols.");
