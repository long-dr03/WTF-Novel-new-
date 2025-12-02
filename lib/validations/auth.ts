import { z } from "zod"

// Login schema
export const loginSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
})

// Register schema
export const registerSchema = z.object({
    username: z.string().min(3, "Tên người dùng phải có ít nhất 3 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
})

// Profile update schema
export const profileUpdateSchema = z.object({
    username: z.string().min(3, "Tên người dùng phải có ít nhất 3 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    avatar: z.any().optional(),
    oldPassword: z.string().optional(),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự").optional().or(z.literal("")),
    confirmPassword: z.string().optional(),
}).refine((data) => {
    if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmPassword
    }
    return true
}, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
