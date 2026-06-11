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
import { PenLine, ChevronDown, Compass, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicGenresService } from "@/services/novelService";
import { useTheme } from "next-themes";

export const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [genres, setGenres] = useState<{ _id: string; name: string; slug: string }[]>([]);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchGenres = async () => {
            try {
                const data = await getPublicGenresService();
                if (data) {
                    setGenres(data);
                }
            } catch (error) {
                console.error("Failed to fetch genres", error);
            }
        };
        fetchGenres();
    }, []);
    
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full max-w-[1300px] mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="rounded-lg" />
                    <span className="text-xl font-bold">Novel</span>
                </Link>

                <div className="flex-1 max-w-xl mx-6 flex items-center justify-center gap-1.5">
                    <HeaderSearch />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="flex items-center gap-1.5 font-semibold select-none cursor-pointer hover:bg-accent/50 text-foreground transition-all duration-200 shrink-0"
                            >
                                <Compass className="h-4 w-4 text-primary" />
                                <span>Thể loại</span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform duration-200" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="end" 
                            className="w-[320px] p-2.5 bg-popover/95 backdrop-blur-md border border-border/85 shadow-2xl rounded-xl animate-in fade-in-50 slide-in-from-top-1"
                        >
                            <div className="grid grid-cols-2 gap-1">
                                {genres.length > 0 ? (
                                    genres.map((genre) => (
                                        <DropdownMenuItem 
                                            key={genre._id} 
                                            asChild 
                                            className="group cursor-pointer rounded-lg px-2.5 py-2 focus:bg-primary/10 focus:text-primary hover:bg-primary/10 hover:text-primary transition-all duration-150"
                                        >
                                            <Link href={`/genre/${genre.slug}`} className="flex items-center w-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/30 mr-2 group-hover:bg-primary group-focus:bg-primary group-hover:scale-125 group-focus:scale-125 transition-all duration-150" />
                                                <span className="text-sm font-medium transition-transform duration-150 group-hover:translate-x-0.5 group-focus:translate-x-0.5">{genre.name}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-center py-4 text-sm text-muted-foreground animate-pulse">
                                        Đang tải thể loại...
                                    </div>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle Button */}
                    {mounted && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="cursor-pointer hover:bg-accent/50 text-foreground transition-all duration-200"
                            title="Đổi giao diện Sáng/Tối"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-4 w-4 text-amber-500" />
                            ) : (
                                <Moon className="h-4 w-4 text-indigo-600" />
                            )}
                        </Button>
                    )}

                    {/* Nút Sáng tác - chỉ hiển thị cho tác giả hoặc admin */}
                    {isAuthenticated && user && (user.role === 'author' || user.role === 'admin') && (
                        <Button variant="outline" asChild className="gap-2">
                            <Link href="/author">
                                <PenLine className="h-4 w-4" />
                                Sáng tác
                            </Link>
                        </Button>
                    )}

                    {/* Nút Admin - chỉ hiển thị cho admin */}
                    {isAuthenticated && user && user.role === 'admin' && (
                        <Button variant="default" asChild className="gap-2">
                            <Link href="/admin">
                                Admin
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