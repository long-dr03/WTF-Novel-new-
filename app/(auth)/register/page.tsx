"use client"

import { RegisterForm } from "@/components/forms"
import { type RegisterFormData } from "@/lib/validations/auth"
import { getRegister } from "@/services/resgisterService"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleRegister = async (data: RegisterFormData) => {
        try {
            setIsLoading(true)
            setError("")

            // Using the existing service
            const result = await getRegister(data.email, data.password, data.username) as any

            if (result) {
                // Store token if returned
                if (result.token) {
                    localStorage.setItem('jwt', result.token)
                }

                // Redirect to login page or profile on success
                router.push('/login')
            } else {
                setError("Đăng ký thất bại. Email có thể đã được sử dụng.")
            }
        } catch (error) {
            console.error("Register error:", error)
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

                <RegisterForm onSubmit={handleRegister} />

                <div className="text-center text-sm text-muted-foreground">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Đăng nhập ngay
                    </Link>
                </div>
            </div>
        </div>
    )
}
