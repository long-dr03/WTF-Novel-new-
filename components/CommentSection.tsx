"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ThumbsUp, MessageSquare, Flag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface Comment {
    id: string
    user: {
        name: string
        avatar?: string
    }
    content: string
    createdAt: Date
    likes: number
    replies?: Comment[]
}

const MOCK_COMMENTS: Comment[] = [
    {
        id: "1",
        user: { name: "Độc Giả Vô Danh", avatar: "/avatars/01.png" },
        content: "Truyện hay quá, hóng chương mới!",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        likes: 12,
        replies: []
    },
    {
        id: "2",
        user: { name: "Tiên Đế", avatar: "/avatars/02.png" },
        content: "Main bá đạo quá, nhưng mà hơi ít đất diễn cho nữ chính.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        likes: 5,
        replies: [
             {
                id: "2-1",
                user: { name: "Tác Giả", avatar: "/avatars/author.png" },
                content: "Sắp tới sẽ có arc riêng cho nữ chính nhé bạn!",
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
                likes: 8
            }
        ]
    }
]

export function CommentSection({ theme = 'light' }: { theme?: 'light' | 'sepia' | 'dark' }) {
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
    const [newComment, setNewComment] = useState("")

    const handleSubmit = () => {
        if (!newComment.trim()) return;
        
        const comment: Comment = {
            id: Date.now().toString(),
            user: { name: "Bạn", avatar: "" }, // TODO: Get from auth context
            content: newComment,
            createdAt: new Date(),
            likes: 0,
            replies: []
        }

        setComments([comment, ...comments])
        setNewComment("")
    }

    const isLight = theme === 'light';
    const isSepia = theme === 'sepia';
    
    const containerBg = isLight ? 'bg-white/80' : isSepia ? 'bg-[#faf8f3]' : 'bg-[#2d2d2d]';
    const containerBorder = isLight ? 'border-stone-200' : isSepia ? 'border-[#e8dcc8]' : 'border-[#404040]';
    const textMain = isLight ? 'text-stone-850' : isSepia ? 'text-[#5f4b32]' : 'text-stone-100';
    const textMuted = isLight ? 'text-stone-500' : isSepia ? 'text-[#5f4b32]/60' : 'text-stone-400';
    const textareaBgBorder = isLight ? 'bg-white border-stone-200 text-stone-850 focus-visible:ring-primary' : isSepia ? 'bg-[#faf8f3] border-[#e8dcc8] text-[#5f4b32] placeholder:text-[#5f4b32]/40 focus-visible:ring-primary' : 'bg-[#1a1a1a] border-[#404040] text-stone-100 placeholder:text-stone-400 focus-visible:ring-primary';
    const avatarBorder = isLight ? 'border-stone-200' : isSepia ? 'border-[#e8dcc8]' : 'border-[#404040]';
    const commentName = isLight ? 'text-stone-850 font-bold' : isSepia ? 'text-[#5f4b32] font-bold' : 'text-stone-200 font-bold';
    const commentText = isLight ? 'text-stone-750' : isSepia ? 'text-[#5f4b32]/95' : 'text-stone-300';
    const replyBorder = isLight ? 'border-stone-200' : isSepia ? 'border-[#e8dcc8]' : 'border-[#404040]';
    const actionText = isLight ? 'text-stone-500 hover:text-primary' : isSepia ? 'text-[#5f4b32]/75 hover:text-primary' : 'text-stone-400 hover:text-primary';

    return (
        <div className={`rounded-xl p-6 border mt-8 ${containerBg} ${containerBorder} ${textMain}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Bình luận ({comments.length})
            </h3>

            {/* Input */}
            <div className="flex gap-4 mb-8">
                <Avatar className={`border ${avatarBorder}`}>
                    <AvatarFallback>B</AvatarFallback>
                </Avatar>
                <div className="flex-1 gap-2 flex flex-col">
                    <Textarea 
                        placeholder="Chia sẻ suy nghĩ của bạn về chương này..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className={`min-h-[100px] resize-none ${textareaBgBorder}`}
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} disabled={!newComment.trim()}>
                            <Send className="w-4 h-4 mr-2" />
                            Gửi bình luận
                        </Button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                        <Avatar className={`w-10 h-10 border ${avatarBorder}`}>
                            <AvatarImage src={comment.user.avatar} />
                            <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${commentName}`}>{comment.user.name}</span>
                                <span className={`text-xs ${textMuted}`}>
                                    {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: vi })}
                                </span>
                            </div>
                            <p className={`text-sm mb-2 ${commentText}`}>{comment.content}</p>
                            
                            <div className={`flex items-center gap-4 text-xs ${textMuted}`}>
                                <button className={`flex items-center gap-1 transition-colors ${actionText}`}>
                                    <ThumbsUp className="w-3 h-3" />
                                    {comment.likes > 0 && <span>{comment.likes}</span>}
                                    Thích
                                </button>
                                <button className={`transition-colors ${actionText}`}>
                                    Trả lời
                                </button>
                                <button className={`hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 ml-auto`}>
                                    <Flag className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className={`mt-4 pl-4 border-l-2 space-y-4 ${replyBorder}`}>
                                     {comment.replies.map(reply => (
                                         <div key={reply.id} className="flex gap-3">
                                            <Avatar className={`w-8 h-8 border ${avatarBorder}`}>
                                                <AvatarImage src={reply.user.avatar} />
                                                <AvatarFallback>{reply.user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`font-semibold text-sm ${commentName}`}>{reply.user.name}</span>
                                                    <span className={`text-xs ${textMuted}`}>
                                                        {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${commentText}`}>{reply.content}</p>
                                            </div>
                                         </div>
                                     ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
