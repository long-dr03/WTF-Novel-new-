"use client"

import React from "react"
import { Facebook, Mail, ArrowUp } from "lucide-react"
import Link from "next/link"

export const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <footer className="relative w-full bg-zinc-950 text-zinc-400 border-t border-zinc-900 mt-auto py-12 px-4 shadow-inner">
            <div className="container mx-auto flex flex-col items-center gap-6">
                
                {/* Social Links Circular Icons */}
                <div className="flex items-center gap-4">
                    <a 
                        href="mailto:support@laophutgia.net" 
                        className="w-9 h-9 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 flex items-center justify-center transition-all shadow hover:scale-105 active:scale-95" 
                        title="Gửi email liên hệ"
                    >
                        <Mail size={16} />
                    </a>
                    <a 
                        href="https://facebook.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-9 h-9 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 flex items-center justify-center transition-all shadow hover:scale-105 active:scale-95" 
                        title="Kết nối Facebook"
                    >
                        <Facebook size={16} fill="currentColor" stroke="none" />
                    </a>
                </div>

                {/* Policies Links */}
                <div className="flex items-center gap-3.5 text-xs font-bold text-zinc-300">
                    <Link href="/about" className="hover:text-primary transition-colors duration-200">Giới thiệu</Link>
                    <span className="text-zinc-800">|</span>
                    <Link href="/policy" className="hover:text-primary transition-colors duration-200">Chính sách</Link>
                </div>

                {/* Branding and copyright info */}
                <div className="text-center space-y-1 z-10">
                    <p className="text-xs text-zinc-400 font-medium">
                        Đọc & nghe truyện tại <span className="font-bold text-zinc-250 hover:text-primary transition-colors">gocaudio</span>
                    </p>
                    <p className="text-[10px] text-zinc-650 tracking-wider">
                        © {new Date().getFullYear()} gocaudio. All rights reserved.
                    </p>
                    <p className="text-[10px] text-zinc-500 tracking-wide">
                        Thiết kế &amp; phát triển bởi{" "}
                        <a
                            href="https://wtfdev.qzz.io/"
                            target="_blank"
                            rel="noopener"
                            title="WTF Dev Studio — thiết kế & phát triển web"
                            className="font-semibold text-zinc-300 hover:text-primary transition-colors"
                        >
                            WTF Dev Studio
                        </a>
                    </p>
                </div>
            </div>

            {/* Floating Back to Top Button */}
            <button
                onClick={scrollToTop}
                className="absolute right-6 bottom-6 p-2.5 rounded-lg bg-zinc-900 hover:bg-primary hover:text-white border border-zinc-800 text-zinc-400 transition-all cursor-pointer shadow hover:scale-105 active:scale-95"
                title="Lên đầu trang"
            >
                <ArrowUp size={16} />
            </button>
        </footer>
    )
}