import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Kết hợp các class CSS sử dụng clsx và tailwind-merge
 * @param inputs Các class cần kết hợp
 * @returns Chuỗi class đã được gộp và xử lý xung đột Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
