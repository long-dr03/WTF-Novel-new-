import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(request: NextRequest) {
    try {
        const { content, mode } = await request.json();

        if (!content) {
            return NextResponse.json(
                { success: false, error: 'Nội dung không được để trống' },
                { status: 400 }
            );
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'GROQ_API_KEY chưa được cấu hình' },
                { status: 500 }
            );
        }

        // Prompt điều chỉnh văn phong
        const systemPrompt = `Bạn là một biên tập viên chuyên nghiệp, chuyên biên tập truyện dịch từ tiếng Trung sang tiếng Việt.
NHIỆM VỤ: Điều chỉnh văn phong đoạn văn được cung cấp để phù hợp với ngữ pháp và cách đọc tự nhiên của người Việt.

QUY TẮC QUAN TRỌNG:
1. Giữ nguyên ý nghĩa gốc, KHÔNG thêm/bớt nội dung
2. Sửa lỗi ngữ pháp, từ ngữ dịch máy móc (convert)
3. Chuyển đổi thành ngữ/tục ngữ sang tương đương tiếng Việt
4. Giữ nguyên tên riêng, định dạng HTML
5. KHÔNG giải thích, chỉ trả về kết quả

${mode === 'aggressive' ? `
CHẾ ĐỘ: MẠNH MẼ
- Viết lại câu cho trôi chảy, văn chương
- Có thể thay đổi cấu trúc câu
` : mode === 'moderate' ? `
CHẾ ĐỘ: VỪA PHẢI
- Cân bằng giữa giữ nguyên và chỉnh sửa
- Chỉ sửa những chỗ quá sượng
` : `
CHẾ ĐỘ: NHẸ NHÀNG
- Chỉ sửa lỗi ngữ pháp cơ bản
- Giữ nguyên văn phong gốc tối đa
`}
`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `NỘI DUNG CẦN SỬA:\n---\n${content}\n---\n\nKẾT QUẢ ĐÃ BIÊN TẬP:`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 4096,
            top_p: 1,
            stream: false,
            stop: null
        });

        const adjustedContent = completion.choices[0]?.message?.content || "";

        return NextResponse.json({
            success: true,
            data: {
                original: content,
                adjusted: adjustedContent,
            }
        });

    } catch (error: any) {
        console.error('Groq API Error:', error);

        // Handle Rate Limits
        if (error?.status === 429 || error?.message?.includes('429')) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Đã đạt giới hạn API Groq. Vui lòng đợi.`,
                    isRateLimit: true,
                    retryAfter: 60
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || 'Lỗi xử lý Groq API' },
            { status: 500 }
        );
    }
}
