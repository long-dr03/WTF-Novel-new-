import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '100d';

interface TokenPayload {
    userId: string;
    email: string;
}

/**
 * Tạo mới JWT
 * @param payload Thông tin người dùng (vd: userId, email)
 * @returns Chuỗi JWT đã ký
 */
export const signToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

/**
 * Xác minh JWT
 * @param token Chuỗi JWT
 * @returns Payload nếu hợp lệ, hoặc ném lỗi
 */
export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
