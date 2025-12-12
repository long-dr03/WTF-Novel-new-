"use client"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { useAuth } from "./providers/AuthProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HeaderSearch } from "./header-search";
import { PenLine } from "lucide-react";

export const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full max-w-[1300px] mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="rounded-lg" />
                    <span className="text-xl font-bold">Novel</span>
                </Link>

                <div className="flex-1 max-w-md mx-4">
                    <HeaderSearch />
                </div>

                <div className="flex items-center gap-4">
                    {/* Nút Sáng tác - chỉ hiển thị cho tác giả */}
                    {isAuthenticated && user && (user.role === 'author' || user.role === 'admin') && (
                        <Button variant="outline" asChild className="gap-2">
                            <Link href="/author">
                                <PenLine className="h-4 w-4" />
                                Sáng tác
                            </Link>
                        </Button>
                    )}
                    
                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="cursor-pointer">
                                    <AvatarImage src={user.avatar || "https://github.com/shadcn.png"} />
                                    <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">Hồ sơ cá nhân</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={logout} className="text-red-500">
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" asChild>
                                <Link href="/login">Đăng nhập</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Đăng ký</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};