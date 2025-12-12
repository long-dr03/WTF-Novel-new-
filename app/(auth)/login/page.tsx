"use client"

import { LoginForm } from "@/components/forms"
import { type LoginFormData } from "@/lib/validations/auth"
import { getLogin } from "@/services/resgisterService"
import { useAuth } from "@/components/providers/AuthProvider"
import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
    const { login } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (data: LoginFormData) => {
        try {
            setIsLoading(true)
            setError("")

            // Using the existing service with email as valueLogin and false for remember
            const result = await getLogin(data.email, data.password, false) as any

            if (result && result.token) {
                // API trả về format: { token, data: { user } }
                const userData = result.data?.user || result.user
                
                if (userData) {
                    // Sử dụng login từ AuthProvider để cập nhật state ngay lập tức
                    login(result.token, {
                        id: userData.id || userData._id || '',
                        username: userData.username || data.email.split('@')[0],
                        email: userData.email || data.email,
                        avatar: userData.avatar,
                        role: userData.role || 'user'
                    })
                } else {
                    setError("Đăng nhập thất bại. Không thể lấy thông tin người dùng.")
                }
            } else {
                setError("Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.")
            }
        } catch (error) {
            console.error("Login error:", error)
            setError("Có lỗi xảy ra. Vui lòng thử lại.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 w-[100vw]">
            <div className="w-full max-w-md space-y-4">
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        {error}
                    </div>
                )}

                <LoginForm onSubmit={handleLogin} />

                <div className="text-center text-sm text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                        Đăng ký ngay
                    </Link>
                </div>
            </div>
        </div>
    )
}
