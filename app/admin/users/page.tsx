"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Shield, Ban, CheckCircle, Search, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import axios from "@/setup/axios"
import { toast } from "sonner"

interface User {
    _id: string
    username: string
    email: string
    role: 'user' | 'admin' | 'author'
    avatar: string
    isBanned: boolean
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await axios.get('/admin/users', {
                params: { page, search }
            })
            const data:any = res; // Interceptor returns data directly
            setUsers(data.users)
            setTotalPages(data.pages)
        } catch (error) {
            toast.error("Không thể tải danh sách người dùng")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers()
        }, 300)
        return () => clearTimeout(timer)
    }, [page, search])

    const handleUpdateStatus = async (userId: string, isBanned: boolean) => {
        try {
            await axios.put(`/admin/users/${userId}/status`, { isBanned })
            toast.success(isBanned ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản")
            fetchUsers()
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái")
        }
    }

    const handleUpdateRole = async (userId: string, role: string) => {
        try {
            await axios.put(`/admin/users/${userId}/status`, { role })
            toast.success(`Đã cập nhật vai trò thành ${role}`)
            fetchUsers()
        } catch (error) {
            toast.error("Lỗi khi cập nhật vai trò")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Người dùng</h2>
                    <p className="text-muted-foreground">Quản lý tài khoản và phân quyền.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm người dùng..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>Tên đăng nhập</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Không tìm thấy người dùng.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar} alt={user.username} />
                                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'author' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isBanned ? "destructive" : "outline"} className={!user.isBanned ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}>
                                            {user.isBanned ? "Bị khóa" : "Hoạt động"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user._id)}>
                                                    Copy ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Đổi vai trò</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleUpdateRole(user._id, 'user')}>
                                                    User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateRole(user._id, 'author')}>
                                                    Author
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateRole(user._id, 'admin')}>
                                                    Admin
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {user.isBanned ? (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(user._id, false)} className="text-green-500">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Mở khóa
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(user._id, true)} className="text-destructive">
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Khóa tài khoản
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Trai</Button>
                <div className="text-sm text-muted-foreground">{page} / {totalPages || 1}</div>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Phai</Button>
             </div>
        </div>
    )
}
