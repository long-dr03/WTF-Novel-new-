import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Client lấy API key từ environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
    try {
        const { content, mode } = await request.json();

        if (!content) {
            return NextResponse.json(
                { success: false, error: 'Nội dung không được để trống' },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'GEMINI_API_KEY chưa được cấu hình' },
                { status: 500 }
            );
        }

        // Prompt điều chỉnh văn phong cho truyện dịch từ tiếng Trung
        const prompt = `Bạn là một biên tập viên chuyên nghiệp, có nhiều năm kinh nghiệm biên tập truyện dịch từ tiếng Trung sang tiếng Việt.

NHIỆM VỤ: Điều chỉnh văn phong của đoạn văn sau để phù hợp với cách đọc tự nhiên của người Việt.

QUY TẮC QUAN TRỌNG:
1. Giữ nguyên ý nghĩa gốc, KHÔNG thêm hoặc bớt nội dung
2. Sắp xếp lại thứ tự từ ngữ theo ngữ pháp tiếng Việt tự nhiên
3. Thay thế các cụm từ dịch máy móc bằng cách diễn đạt tự nhiên hơn
4. Loại bỏ các cụm từ thừa, lặp lại không cần thiết
5. Điều chỉnh các thành ngữ, tục ngữ Trung Quốc sang cách nói tương đương trong tiếng Việt
6. Giữ nguyên tên riêng, địa danh, thuật ngữ đặc biệt
7. KHÔNG thêm chú thích hay giải thích
8. Giữ nguyên định dạng HTML nếu có (các tag như <p>, <strong>, <em>, etc.)
9. Trả về KẾT QUẢ ĐÃ CHỈNH SỬA TRỰC TIẾP, không giải thích

${mode === 'aggressive' ? `
CHẾ ĐỘ: MẠNH MẼ
- Viết lại toàn bộ câu nếu cần để đọc trôi chảy hơn
- Có thể thay đổi cấu trúc câu hoàn toàn
- Ưu tiên sự mượt mà trong cách đọc
` : mode === 'moderate' ? `
CHẾ ĐỘ: VỪA PHẢI  
- Chỉ chỉnh sửa những chỗ đọc không tự nhiên
- Giữ cấu trúc câu gốc nếu có thể
- Cân bằng giữa giữ nguyên văn và điều chỉnh
` : `
CHẾ ĐỘ: NHẸ NHÀNG
- Chỉ sửa những lỗi rõ ràng về ngữ pháp
- Giữ nguyên văn phong gốc tối đa
- Ưu tiên giữ nguyên nội dung
`}

NỘI DUNG CẦN ĐIỀU CHỈNH:
---
${content}
---

KẾT QUẢ:`;

        // Sử dụng API mới với model gemini-2.5-flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const adjustedContent = response.text;

        return NextResponse.json({
            success: true,
            data: {
                original: content,
                adjusted: adjustedContent,
            }
        });

    } catch (error: any) {
        console.error('Gemini API Error:', error);
        console.error('Gemini API Error:');

        // Kiểm tra lỗi rate limit và parse retryAfter
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate')) {
            // Cố gắng parse thời gian retry từ error message
            let retryAfter = 30; // Mặc định 30 giây
            const retryMatch = error.message?.match(/retry in (\d+\.?\d*)/i);
            if (retryMatch) {
                retryAfter = Math.ceil(parseFloat(retryMatch[1]));
            }

            return NextResponse.json(
                { 
                    success: false, 
                    error: `Đã đạt giới hạn API. Vui lòng đợi ${retryAfter} giây rồi thử lại.`,
                    isRateLimit: true,
                    retryAfter: retryAfter
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Có lỗi xảy ra khi xử lý' },
            { status: 500 }
        );
    }
}
