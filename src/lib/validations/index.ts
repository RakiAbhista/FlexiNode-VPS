import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password wajib diisi"),
    agreeTerms: z.literal(true, {
      message: "Kamu harus menyetujui Syarat & Ketentuan",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const otpSchema = z.object({
  code: z.string().length(6, "Kode OTP harus 6 digit angka"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const checkoutSchema = z.object({
  planId: z.string().min(1, "Silakan pilih paket server"),
  paymentMethod: z.enum(["BALANCE", "GATEWAY"], {
    message: "Pilih metode pembayaran",
  }),
});

export const topUpSchema = z.object({
  amount: z.number().min(10000, "Minimum top-up adalah Rp10.000"),
  paymentMethod: z.enum(["GATEWAY"]),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  githubHandle: z.string().optional(),
});

export const planAdminSchema = z.object({
  name: z.string().min(3, "Nama paket minimal 3 karakter"),
  durationDays: z.number().min(1, "Durasi minimal 1 hari"),
  ramMb: z.number().min(256, "RAM minimal 256MB"),
  cpuAllowance: z.number().min(10, "CPU minimal 10%"),
  storageGb: z.number().min(1, "Storage minimal 1GB"),
  price: z.number().min(500, "Harga minimal Rp500"),
  active: z.boolean(),
  tier: z.enum(["Starter", "Basic", "Pro"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type TopUpInput = z.infer<typeof topUpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PlanAdminInput = z.infer<typeof planAdminSchema>;
