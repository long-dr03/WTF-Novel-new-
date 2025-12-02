"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/setup/axios'

interface User {
    id: string
    username: string
    email: string
    avatar?: string
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (token: string, user: User) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('jwt')
            if (token) {
                try {
                    // Fetch user profile using the token
                    const response: any = await axios.get('/me')
                    if (response && response.data && response.data.user) {
                        setUser(response.data.user)
                    } else {
                        // If token is invalid or request fails, clear auth
                        localStorage.removeItem('jwt')
                        setUser(null)
                    }
                } catch (error) {
                    console.error('Auth check failed:', error)
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

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
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
