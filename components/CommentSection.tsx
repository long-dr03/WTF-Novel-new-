"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ThumbsUp, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { useAuth } from "@/components/providers/AuthProvider"
import { getCommentsService, createCommentService, likeCommentService } from "@/services/novelService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Comment {
    _id: string
    userId: {
        _id: string
        username: string
        avatar?: string
    }
    content: string
    createdAt: string | Date
    likes: string[]
    parentId?: string | null
    replies?: Comment[]
}

interface CommentSectionProps {
    theme?: 'light' | 'sepia' | 'dark'
    novelId: string
    chapterId: string
}

export function CommentSection({ theme = 'light', novelId, chapterId }: CommentSectionProps) {
    const { user } = useAuth()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(true)
    const [replyingToId, setReplyingToId] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null)
    const [cooldown, setCooldown] = useState(false)
    const [replyCooldown, setReplyCooldown] = useState(false)

    const fetchComments = useCallback(async () => {
        if (!novelId) return
        try {
            const data = await getCommentsService(novelId, chapterId)
            if (data) {
                setComments(data)
            }
        } catch (error) {
            console.error("Failed to fetch comments", error)
        } finally {
            setLoading(false)
        }
    }, [novelId, chapterId])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    const handleSubmit = async () => {
        if (!newComment.trim() || !user || isSubmitting || cooldown) return
        
        setIsSubmitting(true)
        try {
            const data = await createCommentService(novelId, newComment, chapterId)
            if (data) {
                setComments([data, ...comments])
                setNewComment("")
                toast.success("Đã gửi bình luận thành công")
                
                setCooldown(true)
                setTimeout(() => setCooldown(false), 3000)
            } else {
                toast.error("Không thể gửi bình luận")
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi gửi bình luận")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReplySubmit = async (parentId: string) => {
        if (!replyContent.trim() || !user || submittingReplyId || replyCooldown) return

        setSubmittingReplyId(parentId)
        try {
            const data = await createCommentService(novelId, replyContent, chapterId, parentId)
            if (data) {
                setComments(comments.map(c => {
                    if (c._id === parentId) {
                        return {
                            ...c,
                            replies: [...(c.replies || []), data]
                        }
                    }
                    return c
                }))
                setReplyContent("")
                setReplyingToId(null)
                toast.success("Đã gửi phản hồi thành công")
                
                setReplyCooldown(true)
                setTimeout(() => setReplyCooldown(false), 3000)
            } else {
                toast.error("Không thể gửi phản hồi")
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi gửi phản hồi")
        } finally {
            setSubmittingReplyId(null)
        }
    }

    const handleLike = async (commentId: string, parentId?: string | null) => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thích bình luận")
            return
        }

        try {
            const data = await likeCommentService(commentId)
            if (data) {
                if (parentId) {
                    setComments(comments.map(c => {
                        if (c._id === parentId) {
                            return {
                                ...c,
                                replies: (c.replies || []).map(r => r._id === commentId ? data : r)
                            }
                        }
                        return c
                    }))
                } else {
                    setComments(comments.map(c => c._id === commentId ? { ...data, replies: c.replies } : c))
                }
            }
        } catch (error) {
            console.error("Error liking comment", error)
        }
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

    const totalCommentsCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

    const getInitials = (name?: string) => {
        return name ? name.charAt(0).toUpperCase() : "?";
    }

    const formatDate = (dateStr: string | Date) => {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
        } catch (e) {
            return "Vừa xong";
        }
    }

    if (loading) {
        return (
            <div className={`rounded-xl p-4 sm:p-6 border mt-8 ${containerBg} ${containerBorder} ${textMain} text-center py-8`}>
                <p className="animate-pulse">Đang tải bình luận...</p>
            </div>
        )
    }

    return (
        <div className={`rounded-xl p-4 sm:p-6 border mt-8 ${containerBg} ${containerBorder} ${textMain}`}>
            <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Bình luận ({totalCommentsCount})
            </h3>

            {/* Input */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
                {/* Mobile Input User Header */}
                <div className="flex items-center gap-3 sm:hidden">
                    <Avatar className={`w-8 h-8 border ${avatarBorder}`}>
                        {user ? (
                            <>
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="text-xs bg-primary text-white">{getInitials(user.username)}</AvatarFallback>
                            </>
                        ) : (
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">?</AvatarFallback>
                        )}
                    </Avatar>
                    <span className="text-xs font-semibold text-muted-foreground">
                        {user ? user.username : "Khách"}
                    </span>
                </div>
                {/* Desktop Input User Avatar */}
                <Avatar className={`hidden sm:block border ${avatarBorder}`}>
                    {user ? (
                        <>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary text-white">{getInitials(user.username)}</AvatarFallback>
                        </>
                    ) : (
                        <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
                    )}
                </Avatar>
                <div className="flex-1 gap-2 flex flex-col">
                    <Textarea 
                        placeholder={user ? "Chia sẻ suy nghĩ của bạn về chương này..." : "Đăng nhập để chia sẻ bình luận của bạn..."} 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!user}
                        className={`min-h-[100px] resize-none ${textareaBgBorder}`}
                    />
                    <div className="flex justify-end">
                        {user ? (
                            <Button onClick={handleSubmit} disabled={!newComment.trim() || isSubmitting || cooldown} className="w-full sm:w-auto">
                                <Send className="w-4 h-4 mr-2" />
                                {isSubmitting ? "Đang gửi..." : cooldown ? "Chờ 3s..." : "Gửi bình luận"}
                            </Button>
                        ) : (
                            <Button asChild className="w-full sm:w-auto bg-primary text-white">
                                <Link href="/login">Đăng nhập</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-6">
                {comments.map((comment) => {
                    const hasLikedComment = user && comment.likes?.includes(user.id);
                    return (
                        <div key={comment._id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 group">
                            {/* Mobile User Header */}
                            <div className="flex items-center gap-3 sm:hidden">
                                <Avatar className={`w-9 h-9 border ${avatarBorder}`}>
                                    <AvatarImage src={comment.userId?.avatar} />
                                    <AvatarFallback className="text-xs">{getInitials(comment.userId?.username)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className={`font-semibold text-sm truncate ${commentName}`}>{comment.userId?.username || "Ẩn danh"}</span>
                                    <span className={`text-[10px] ${textMuted}`}>
                                        {formatDate(comment.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Desktop User Avatar */}
                            <Avatar className={`hidden sm:block w-10 h-10 border ${avatarBorder}`}>
                                <AvatarImage src={comment.userId?.avatar} />
                                <AvatarFallback>{getInitials(comment.userId?.username)}</AvatarFallback>
                            </Avatar>

                            {/* Content Area */}
                            <div className="flex-1 sm:pl-0 pl-1">
                                {/* Desktop User Header */}
                                <div className="hidden sm:flex items-center justify-between mb-1">
                                    <span className={`font-semibold text-sm ${commentName}`}>{comment.userId?.username || "Ẩn danh"}</span>
                                    <span className={`text-xs ${textMuted}`}>
                                        {formatDate(comment.createdAt)}
                                    </span>
                                </div>

                                {/* Comment content */}
                                <p className={`text-sm mb-2 leading-relaxed ${commentText}`}>{comment.content}</p>
                                
                                {/* Action links */}
                                <div className={`flex items-center gap-4 text-xs ${textMuted}`}>
                                    <button 
                                        onClick={() => handleLike(comment._id)}
                                        className={cn(
                                            `flex items-center gap-1 transition-colors ${actionText}`,
                                            hasLikedComment && "text-primary hover:text-primary/80 font-semibold"
                                        )}
                                    >
                                        <ThumbsUp className={`w-3 h-3 ${hasLikedComment ? "fill-current" : ""}`} />
                                        {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
                                        Thích
                                    </button>
                                    {user && (
                                        <button 
                                            onClick={() => {
                                                setReplyingToId(replyingToId === comment._id ? null : comment._id);
                                                setReplyContent("");
                                            }}
                                            className={`transition-colors ${actionText} ${replyingToId === comment._id && "text-primary font-semibold"}`}
                                        >
                                            Trả lời
                                        </button>
                                    )}
                                </div>

                                {/* Reply Input box */}
                                {replyingToId === comment._id && (
                                    <div className="mt-3 flex flex-col gap-2">
                                        <Textarea
                                            placeholder="Nhập câu trả lời của bạn..."
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            className={`min-h-[70px] text-sm resize-none ${textareaBgBorder}`}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => {
                                                    setReplyingToId(null);
                                                    setReplyContent("");
                                                }}
                                                disabled={submittingReplyId === comment._id}
                                            >
                                                Hủy
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleReplySubmit(comment._id)} 
                                                disabled={!replyContent.trim() || submittingReplyId === comment._id || replyCooldown}
                                            >
                                                {submittingReplyId === comment._id ? "Đang gửi..." : replyCooldown ? "Chờ 3s..." : "Phản hồi"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Replies List */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className={`mt-4 pl-3 sm:pl-4 border-l-2 space-y-4 ${replyBorder}`}>
                                         {comment.replies.map(reply => {
                                             const hasLikedReply = user && reply.likes?.includes(user.id);
                                             return (
                                                 <div key={reply._id} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                                                    {/* Mobile Reply Header */}
                                                    <div className="flex items-center gap-2 sm:hidden">
                                                        <Avatar className={`w-7 h-7 border ${avatarBorder}`}>
                                                            <AvatarImage src={reply.userId?.avatar} />
                                                            <AvatarFallback className="text-[10px]">{getInitials(reply.userId?.username)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`font-semibold text-xs truncate ${commentName}`}>{reply.userId?.username || "Ẩn danh"}</span>
                                                            <span className={`text-[9px] ${textMuted}`}>
                                                                {formatDate(reply.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Desktop Reply Avatar */}
                                                    <Avatar className={`hidden sm:block w-8 h-8 border ${avatarBorder}`}>
                                                        <AvatarImage src={reply.userId?.avatar} />
                                                        <AvatarFallback>{getInitials(reply.userId?.username)}</AvatarFallback>
                                                    </Avatar>

                                                    {/* Reply Content Area */}
                                                    <div className="flex-1 sm:pl-0 pl-1">
                                                        {/* Desktop Reply Header */}
                                                        <div className="hidden sm:flex items-center justify-between mb-1">
                                                            <span className={`font-semibold text-sm ${commentName}`}>{reply.userId?.username || "Ẩn danh"}</span>
                                                            <span className={`text-xs ${textMuted}`}>
                                                                {formatDate(reply.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className={`text-xs sm:text-sm leading-relaxed ${commentText}`}>{reply.content}</p>
                                                        
                                                        {/* Reply actions */}
                                                        <div className={`flex items-center gap-3 mt-1.5 text-[10px] ${textMuted}`}>
                                                            <button 
                                                                onClick={() => handleLike(reply._id, comment._id)}
                                                                className={cn(
                                                                    `flex items-center gap-1 transition-colors ${actionText}`,
                                                                    hasLikedReply && "text-primary hover:text-primary/80 font-semibold"
                                                                )}
                                                            >
                                                                <ThumbsUp className={`w-2.5 h-2.5 ${hasLikedReply ? "fill-current" : ""}`} />
                                                                {reply.likes?.length > 0 && <span>{reply.likes.length}</span>}
                                                                Thích
                                                            </button>
                                                        </div>
                                                    </div>
                                                 </div>
                                             )
                                         })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
