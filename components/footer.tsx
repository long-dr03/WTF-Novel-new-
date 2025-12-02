"use client"
import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
            <div className="w-full max-w-[1300px] mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="rounded-lg" />
                            <span className="text-xl font-bold">Novel</span>
                        </div>
                        <p className="text-sm text-muted-foreground">© 2025 Novel. All rights reserved.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-lg">Liên hệ</h3>
                        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <li className="hover:text-foreground transition-colors">
                                <Link href="/">Facebook</Link>
                            </li>
                            <li className="hover:text-foreground transition-colors">
                                <Link href="/">Instagram</Link>
                            </li>
                            <li className="hover:text-foreground transition-colors">
                                <Link href="/">Twitter</Link>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="font-semibold text-lg">Thông tin</h3>
                        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <li className="hover:text-foreground transition-colors">
                                <Link href="/">Về chúng tôi</Link>
                            </li>
                            <li className="hover:text-foreground transition-colors">
                                <Link href="/">Điều khoản</Link>
                            </li>
                            <li className="hover:text-foreground transition-colors">
                                <Link href="/">Chính sách</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};