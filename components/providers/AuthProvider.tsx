"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/setup/axios'

interface User {
    id: string
    _id: string
    username: string
    email: string
    avatar?: string
    role?: 'user' | 'admin' | 'author'
    createdAt?: string
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (token: string, user: User) => void
    logout: () => void
    updateUser: (partial: Partial<User>) => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Ghi nhận 1 lượt truy cập cho user đã đăng nhập — tối đa 1 lần / phiên trình duyệt
    const trackVisitOnce = () => {
        if (typeof window === 'undefined') return
        if (sessionStorage.getItem('visit-tracked')) return
        sessionStorage.setItem('visit-tracked', '1')
        axios.post('/track/visit').catch(() => {})
    }

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('jwt')
            if (token) {
                try {
                    // Fetch user profile using the token
                    const response: any = await axios.get('/me')
                    if (response && response.user) {
                        setUser(response.user)
                        trackVisitOnce()
                    } else if (response && response.data && response.data.user) {
                        setUser(response.data.user)
                        trackVisitOnce()
                    } else {
                        // If token is invalid or request fails, clear auth
                        localStorage.removeItem('jwt')
                        setUser(null)
                    }
                } catch (error: any) {
                    // Chỉ log lỗi nếu không phải 401/404 (expected errors)
                    if (error?.response?.status !== 401 && error?.response?.status !== 404) {
                        console.error('Auth check failed:', error)
                    }
                    localStorage.removeItem('jwt')
                    setUser(null)
                }
            }
            setIsLoading(false)
        }

        checkAuth()
    }, [])

    const login = (token: string, userData: User) => {
        localStorage.setItem('jwt', token)
        setUser(userData)
        router.push('/profile')
    }

    const logout = () => {
        localStorage.removeItem('jwt')
        setUser(null)
        router.push('/login')
    }

    const updateUser = (partial: Partial<User>) => {
        setUser(prev => (prev ? { ...prev, ...partial } : prev))
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            updateUser,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
