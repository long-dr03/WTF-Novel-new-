import type { Request, Response } from '../types';
import Setting from '../models/Setting';

/**
 * Trang chủ API - Trả về thông báo chào mừng
 */
export const index = (req: Request, res: Response) => {
    res.json({ message: 'Welcome to the Novel Backend API' });
};

/**
 * Cài đặt công khai - Trả về cấu hình hiển thị cho người dùng cuối
 * (quảng cáo 2 bên + popup chào mừng). Không yêu cầu đăng nhập.
 */
export const getPublicSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }
        res.status(200).json({
            siteName: settings.siteName,
            siteDescription: settings.siteDescription,
            ads: settings.ads,
            popup: settings.popup
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy cài đặt công khai', error });
    }
};

/**
 * Endpoint kiểm tra kết nối (Test)
 */
export const test = (req: Request, res: Response) => {
    res.send('hello world');
};
