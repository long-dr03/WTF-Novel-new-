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
import { PenLine, ChevronDown, Compass, Sun, Moon, Menu, X, Home, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicGenresService } from "@/services/novelService";
import { useTheme } from "next-themes";

export const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [genres, setGenres] = useState<{ _id: string; name: string; slug: string }[]>([]);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="rounded-lg" />
                    <span className="text-xl font-bold">Novel</span>
                </Link>

                <div className="hidden md:flex flex-1 max-w-xl mx-6 items-center justify-center gap-1.5">
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

                <div className="flex items-center gap-2 sm:gap-4">
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
                        <Button variant="outline" asChild className="hidden sm:flex gap-2">
                            <Link href="/author">
                                <PenLine className="h-4 w-4" />
                                Sáng tác
                            </Link>
                        </Button>
                    )}

                    {/* Nút Admin - chỉ hiển thị cho admin */}
                    {isAuthenticated && user && user.role === 'admin' && (
                        <Button variant="default" asChild className="hidden sm:flex gap-2">
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
                        <div className="hidden sm:flex gap-2">
                            <Button variant="ghost" asChild>
                                <Link href="/login">Đăng nhập</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Đăng ký</Link>
                            </Button>
                        </div>
                    )}

                    {/* Hamburger Menu Trigger for Mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden cursor-pointer hover:bg-accent/50 text-foreground transition-all duration-200"
                        title="Mở menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setIsMobileMenuOpen(false)} />
                    
                    <div className="relative w-[300px] max-w-[85vw] h-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-200/80 dark:border-zinc-800/80 shadow-[rgba(0,0,0,0.56)_0px_22px_70px_4px] p-6 flex flex-col gap-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">Danh mục</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="cursor-pointer rounded-full h-8 w-8 bg-zinc-100 dark:bg-zinc-900/60 hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 text-zinc-700 dark:text-foreground transition-all hover:scale-105 active:scale-95"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Search in Mobile Menu */}
                        <div className="w-full flex justify-center py-1">
                            <HeaderSearch />
                        </div>

                        {/* Quick Nav Links */}
                        <div className="flex flex-col gap-2">
                            <Link 
                                href="/" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-zinc-55 dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 hover:border-primary/20 transition-all duration-200"
                            >
                                <Home className="h-4.5 w-4.5 text-primary group-hover:scale-110 transition-transform duration-200" />
                                <span className="text-zinc-750 dark:text-zinc-300 group-hover:text-primary dark:group-hover:text-foreground transition-colors">Trang chủ</span>
                            </Link>

                            {isAuthenticated && user && (user.role === 'author' || user.role === 'admin') && (
                                <Link 
                                    href="/author" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-zinc-55 dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 hover:border-primary/20 transition-all duration-200"
                                >
                                    <PenLine className="h-4.5 w-4.5 text-primary group-hover:scale-110 transition-transform duration-200" />
                                    <span className="text-zinc-750 dark:text-zinc-300 group-hover:text-primary dark:group-hover:text-foreground transition-colors">Sáng tác</span>
                                </Link>
                            )}

                            {isAuthenticated && user && user.role === 'admin' && (
                                <Link 
                                    href="/admin" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-zinc-55 dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 hover:border-primary/20 transition-all duration-200"
                                >
                                    <BookOpen className="h-4.5 w-4.5 text-primary group-hover:scale-110 transition-transform duration-200" />
                                    <span className="text-zinc-750 dark:text-zinc-300 group-hover:text-primary dark:group-hover:text-foreground transition-colors">Admin Panel</span>
                                </Link>
                            )}

                            {!isAuthenticated && (
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-zinc-200/80 dark:border-zinc-900">
                                    <Button variant="outline" asChild size="sm" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer">
                                        <Link href="/login">Đăng nhập</Link>
                                    </Button>
                                    <Button asChild size="sm" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                                        <Link href="/register">Đăng ký</Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Collapsible Genres List */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 px-1">
                                Thể loại
                            </h3>
                            <div className="grid grid-cols-2 gap-2 px-0.5 max-h-[280px] overflow-y-auto pr-1">
                                {genres.map((genre) => (
                                    <Link
                                        key={genre._id}
                                        href={`/genre/${genre.slug}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="group flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl bg-zinc-55 dark:bg-zinc-900/20 border border-zinc-200/80 dark:border-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/85 hover:border-primary/20 text-zinc-650 dark:text-zinc-400 hover:text-primary dark:hover:text-foreground transition-all duration-200"
                                    >
                                        <span className="truncate">{genre.name}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-primary transition-colors group-hover:scale-125 duration-200 shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Info / Actions */}
                        <div className="mt-auto border-t border-zinc-200/80 dark:border-zinc-900 pt-4 flex flex-col gap-4">
                            <div className="flex items-center justify-between px-3 py-2 bg-zinc-55 dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-900/50 rounded-xl p-3">
                                <span className="text-xs text-zinc-550 dark:text-zinc-400 font-medium">Giao diện</span>
                                {mounted && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                        className="gap-2 cursor-pointer rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-foreground"
                                    >
                                        {theme === "dark" ? (
                                            <>
                                                <Sun className="h-3.5 w-3.5 text-amber-500" />
                                                <span>Sáng</span>
                                            </>
                                        ) : (
                                            <>
                                                <Moon className="h-3.5 w-3.5 text-indigo-600" />
                                                <span>Tối</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};