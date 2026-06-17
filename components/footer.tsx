"use client"
import { Facebook, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
            <div className="w-full max-w-[1200px] mx-auto px-4 pt-12 pb-28 md:py-12">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left gap-3">
                        <div className="flex items-center gap-2">
                            <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="rounded-lg" />
                            <span className="text-xl font-bold">Novel</span>
                        </div>
                        <p className="text-sm text-muted-foreground">© 2025 Novel. All rights reserved.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-lg">Liên hệ</h3>
                        <ul className="flex flex-col gap-2.5 text-sm">
                            <li>
                                <Link href="/" className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Facebook size={16} strokeWidth={1.5} className="group-hover:text-primary transition-colors" /> 
                                    <span>Facebook</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Instagram size={16} strokeWidth={1.5} className="group-hover:text-primary transition-colors" /> 
                                    <span>Instagram</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Linkedin size={16} strokeWidth={1.5} className="group-hover:text-primary transition-colors" /> 
                                    <span>Linkedin</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-lg">Thông tin</h3>
                        <ul className="flex flex-col gap-2.5 text-sm">
                            <li>
                                <Link href="/" className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors mr-1" />
                                    <span>Về chúng tôi</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors mr-1" />
                                    <span>Điều khoản</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/" className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors mr-1" />
                                    <span>Chính sách</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};