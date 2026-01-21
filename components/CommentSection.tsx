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

export function CommentSection() {
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

    return (
        <div className="bg-card/50 rounded-xl p-6 border border-border/50 mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Bình luận ({comments.length})
            </h3>

            {/* Input */}
            <div className="flex gap-4 mb-8">
                <Avatar>
                    <AvatarFallback>B</AvatarFallback>
                </Avatar>
                <div className="flex-1 gap-2 flex flex-col">
                    <Textarea 
                        placeholder="Chia sẻ suy nghĩ của bạn về chương này..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px] resize-none focus-visible:ring-primary"
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
                        <Avatar className="w-10 h-10 border border-border/50">
                            <AvatarImage src={comment.user.avatar} />
                            <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm">{comment.user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: vi })}
                                </span>
                            </div>
                            <p className="text-sm text-foreground/90 mb-2">{comment.content}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <ThumbsUp className="w-3 h-3" />
                                    {comment.likes > 0 && <span>{comment.likes}</span>}
                                    Thích
                                </button>
                                <button className="hover:text-primary transition-colors">
                                    Trả lời
                                </button>
                                <button className="hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 ml-auto">
                                    <Flag className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-4 pl-4 border-l-2 border-border/50 space-y-4">
                                     {comment.replies.map(reply => (
                                         <div key={reply.id} className="flex gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={reply.user.avatar} />
                                                <AvatarFallback>{reply.user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-sm">{reply.user.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-foreground/90">{reply.content}</p>
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
