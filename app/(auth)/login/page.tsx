"use client"

import { LoginForm } from "@/components/forms"
import { type LoginFormData } from "@/lib/validations/auth"
import { getLogin } from "@/services/resgisterService"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (data: LoginFormData) => {
        try {
            setIsLoading(true)
            setError("")

            // Using the existing service with email as valueLogin and false for remember
            const result = await getLogin(data.email, data.password, false) as any

            if (result) {
                // Store token if returned
                if (result.token) {
                    localStorage.setItem('jwt', result.token)
                }

                // Redirect to home or profile page on success
                router.push('/profile')
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
