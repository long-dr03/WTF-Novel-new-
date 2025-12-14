"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import mammoth from "mammoth";
import {
    Upload,
    FileText,
    Check,
    AlertCircle,
    Loader2,
    Trash2,
    Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ParsedChapter {
    id: string;
    chapterNumber: number;
    title: string;
    content: string;
    wordCount: number;
    charCount: number;
    fileName: string;
    status: "pending" | "uploading" | "success" | "error";
    errorMessage?: string;
}

interface WordUploaderProps {
    isDark: boolean;
    novelId: string;
    currentMaxChapter: number;
    onUploadComplete: (uploadedChapters: ParsedChapter[]) => void;
    onClose: () => void;
    uploadChapterFn: (data: {
        novelId: string;
        chapterNumber: number;
        title: string;
        content: string;
        contentJson: unknown;
        wordCount: number;
        charCount: number;
        status: "draft" | "published" | "scheduled";
    }) => Promise<unknown>;
}

export default function WordUploader({
    isDark,
    novelId,
    currentMaxChapter,
    onUploadComplete,
    onClose,
    uploadChapterFn,
}: WordUploaderProps) {
    const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Extract chapter number from filename (e.g., "chuong-001.docx" -> 1)
    const extractChapterInfo = useCallback(
        (fileName: string): { chapterNumber: number; title: string } => {
            // Pattern: chuong-001, chapter-1, ch1, c1, 001, etc.
            const patterns = [
                /chuong[-_\s]*(\d+)/i,
                /chapter[-_\s]*(\d+)/i,
                /ch[-_\s]*(\d+)/i,
                /c[-_\s]*(\d+)/i,
                /^(\d+)/,
            ];

            for (const pattern of patterns) {
                const match = fileName.match(pattern);
                if (match) {
                    return {
                        chapterNumber: parseInt(match[1], 10),
                        title: `Chương ${parseInt(match[1], 10)}`,
                    };
                }
            }

            // If no pattern found, use next chapter number
            return {
                chapterNumber: currentMaxChapter + 1,
                title: `Chương ${currentMaxChapter + 1}`,
            };
        },
        [currentMaxChapter]
    );

    // Parse Word document content
    const parseWordContent = useCallback(
        async (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target?.result as ArrayBuffer;
                        const result = await mammoth.convertToHtml({ arrayBuffer });
                        resolve(result.value);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error("Không thể đọc file"));
                reader.readAsArrayBuffer(file);
            });
        },
        []
    );

    // Split content by chapter markers if present
    const splitByChapters = useCallback(
        (
            content: string,
            baseChapterNumber: number
        ): { chapterNumber: number; title: string; content: string }[] => {
            // Check for chapter markers like "---Chương 1---" or "===Chapter 1==="
            const chapterPattern =
                /(?:[-=]{3,})\s*(?:Chương|Chapter|Ch\.?)\s*(\d+)[:\s-]*([^-=\n]*)?(?:[-=]{3,})/gi;
            const matches = [...content.matchAll(chapterPattern)];

            if (matches.length > 1) {
                const chapters: {
                    chapterNumber: number;
                    title: string;
                    content: string;
                }[] = [];

                for (let i = 0; i < matches.length; i++) {
                    const match = matches[i];
                    const nextMatch = matches[i + 1];
                    const startIndex = match.index! + match[0].length;
                    const endIndex = nextMatch ? nextMatch.index! : content.length;
                    const chapterContent = content.slice(startIndex, endIndex).trim();

                    if (chapterContent) {
                        chapters.push({
                            chapterNumber: parseInt(match[1], 10),
                            title: match[2]?.trim() || `Chương ${match[1]}`,
                            content: chapterContent,
                        });
                    }
                }

                return chapters;
            }

            // No chapter markers found, return as single chapter
            return [
                {
                    chapterNumber: baseChapterNumber,
                    title: `Chương ${baseChapterNumber}`,
                    content: content,
                },
            ];
        },
        []
    );

    // Count words in HTML content
    const countWords = (htmlContent: string): number => {
        const text = htmlContent.replace(/<[^>]*>/g, " ");
        const words = text
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
        return words.length;
    };

    // Count characters in HTML content
    const countChars = (htmlContent: string): number => {
        const text = htmlContent.replace(/<[^>]*>/g, "");
        return text.length;
    };

    // Handle file drop
    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            setIsProcessing(true);

            const newChapters: ParsedChapter[] = [];
            let nextChapterNum =
                currentMaxChapter +
                1 +
                parsedChapters.filter((c) => c.status === "pending").length;

            for (const file of acceptedFiles) {
                try {
                    const content = await parseWordContent(file);
                    const { chapterNumber, title } = extractChapterInfo(file.name);

                    // Check if content has multiple chapters
                    const splitChapters = splitByChapters(content, chapterNumber || nextChapterNum);

                    for (const chapter of splitChapters) {
                        const id = `${file.name}-${chapter.chapterNumber}-${Date.now()}`;
                        newChapters.push({
                            id,
                            chapterNumber: chapter.chapterNumber,
                            title: chapter.title,
                            content: chapter.content,
                            wordCount: countWords(chapter.content),
                            charCount: countChars(chapter.content),
                            fileName: file.name,
                            status: "pending",
                        });
                    }

                    if (splitChapters.length === 1 && !chapterNumber) {
                        nextChapterNum++;
                    }
                } catch (error) {
                    console.error(`Error parsing ${file.name}:`, error);
                    newChapters.push({
                        id: `${file.name}-error-${Date.now()}`,
                        chapterNumber: nextChapterNum++,
                        title: file.name,
                        content: "",
                        wordCount: 0,
                        charCount: 0,
                        fileName: file.name,
                        status: "error",
                        errorMessage: "Không thể đọc file Word",
                    });
                }
            }

            setParsedChapters((prev) => [...prev, ...newChapters]);
            setIsProcessing(false);
        },
        [
            currentMaxChapter,
            parsedChapters,
            parseWordContent,
            extractChapterInfo,
            splitByChapters,
        ]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                [".docx"],
            "application/msword": [".doc"],
        },
        multiple: true,
    });

    // Update chapter info
    const updateChapter = (
        id: string,
        field: "chapterNumber" | "title",
        value: string | number
    ) => {
        setParsedChapters((prev) =>
            prev.map((ch) => (ch.id === id ? { ...ch, [field]: value } : ch))
        );
    };

    // Remove chapter
    const removeChapter = (id: string) => {
        setParsedChapters((prev) => prev.filter((ch) => ch.id !== id));
    };

    // Upload all pending chapters
    const handleUploadAll = async () => {
        const pendingChapters = parsedChapters.filter(
            (ch) => ch.status === "pending"
        );
        if (pendingChapters.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        const totalChapters = pendingChapters.length;
        let completedChapters = 0;

        for (const chapter of pendingChapters) {
            setParsedChapters((prev) =>
                prev.map((ch) =>
                    ch.id === chapter.id ? { ...ch, status: "uploading" } : ch
                )
            );

            try {
                await uploadChapterFn({
                    novelId,
                    chapterNumber: chapter.chapterNumber,
                    title: chapter.title,
                    content: chapter.content,
                    contentJson: null,
                    wordCount: chapter.wordCount,
                    charCount: chapter.charCount,
                    status: "draft",
                });

                setParsedChapters((prev) =>
                    prev.map((ch) =>
                        ch.id === chapter.id ? { ...ch, status: "success" } : ch
                    )
                );
            } catch (error) {
                setParsedChapters((prev) =>
                    prev.map((ch) =>
                        ch.id === chapter.id
                            ? {
                                  ...ch,
                                  status: "error",
                                  errorMessage:
                                      error instanceof Error
                                          ? error.message
                                          : "Upload thất bại",
                              }
                            : ch
                    )
                );
            }

            completedChapters++;
            setUploadProgress(Math.round((completedChapters / totalChapters) * 100));
        }

        setIsUploading(false);

        // Check if all uploads were successful
        const successChapters = parsedChapters.filter(
            (ch) => ch.status === "success"
        );
        if (successChapters.length > 0) {
            onUploadComplete(successChapters);
        }
    };

    const pendingCount = parsedChapters.filter(
        (ch) => ch.status === "pending"
    ).length;
    const successCount = parsedChapters.filter(
        (ch) => ch.status === "success"
    ).length;
    const errorCount = parsedChapters.filter(
        (ch) => ch.status === "error"
    ).length;

    const getStatusIcon = (status: ParsedChapter["status"]) => {
        switch (status) {
            case "uploading":
                return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
            case "success":
                return <Check className="w-4 h-4 text-green-500" />;
            case "error":
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <FileText className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className={cn(
                    "max-w-2xl max-h-[90vh] flex flex-col",
                    isDark && "dark bg-stone-900 border-stone-700"
                )}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-purple-500" />
                        Upload chương từ file Word
                    </DialogTitle>
                    <DialogDescription>
                        Kéo thả file Word (.doc, .docx) để upload nhiều chương cùng lúc.
                        Hệ thống sẽ tự động nhận diện số chương từ tên file.
                    </DialogDescription>
                </DialogHeader>

                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                        isDragActive
                            ? "border-purple-500 bg-purple-500/10"
                            : isDark
                            ? "border-stone-700 hover:border-stone-600 bg-stone-800/50"
                            : "border-stone-300 hover:border-stone-400 bg-stone-50",
                        isProcessing && "pointer-events-none opacity-50"
                    )}
                >
                    <input {...getInputProps()} />
                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            <p className="text-sm text-muted-foreground">
                                Đang xử lý file...
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload
                                className={cn(
                                    "w-8 h-8",
                                    isDragActive
                                        ? "text-purple-500"
                                        : "text-muted-foreground"
                                )}
                            />
                            <p
                                className={cn(
                                    "text-sm font-medium",
                                    isDragActive
                                        ? "text-purple-500"
                                        : "text-foreground"
                                )}
                            >
                                {isDragActive
                                    ? "Thả file vào đây..."
                                    : "Kéo thả file Word hoặc click để chọn"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Hỗ trợ .doc, .docx • Có thể chọn nhiều file
                            </p>
                        </div>
                    )}
                </div>

                {/* Parsed chapters list */}
                {parsedChapters.length > 0 && (
                    <>
                        <Separator />
                        
                        {/* Stats */}
                        <div className="flex items-center gap-3 text-sm">
                            <Badge variant="outline" className="gap-1">
                                <FileText className="w-3 h-3" />
                                {parsedChapters.length} chương
                            </Badge>
                            {pendingCount > 0 && (
                                <Badge variant="secondary" className="gap-1">
                                    {pendingCount} chờ upload
                                </Badge>
                            )}
                            {successCount > 0 && (
                                <Badge className="gap-1 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                                    <Check className="w-3 h-3" />
                                    {successCount} thành công
                                </Badge>
                            )}
                            {errorCount > 0 && (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errorCount} lỗi
                                </Badge>
                            )}
                        </div>

                        {/* Chapter list */}
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                            {parsedChapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className={cn(
                                        "p-3 rounded-lg border flex items-center gap-3 transition-all",
                                        chapter.status === "success"
                                            ? "border-green-500/30 bg-green-500/5"
                                            : chapter.status === "error"
                                            ? "border-red-500/30 bg-red-500/5"
                                            : chapter.status === "uploading"
                                            ? "border-blue-500/30 bg-blue-500/5"
                                            : isDark
                                            ? "border-stone-700 bg-stone-800/50"
                                            : "border-stone-200 bg-white"
                                    )}
                                >
                                    {/* Status icon */}
                                    <div className="shrink-0">
                                        {getStatusIcon(chapter.status)}
                                    </div>

                                    {/* Chapter info */}
                                    <div className="flex-1 min-w-0">
                                        {editingId === chapter.id ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={chapter.chapterNumber}
                                                    onChange={(e) =>
                                                        updateChapter(
                                                            chapter.id,
                                                            "chapterNumber",
                                                            parseInt(e.target.value) || 1
                                                        )
                                                    }
                                                    className="w-20 h-8"
                                                    min={1}
                                                />
                                                <Input
                                                    type="text"
                                                    value={chapter.title}
                                                    onChange={(e) =>
                                                        updateChapter(
                                                            chapter.id,
                                                            "title",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="flex-1 h-8"
                                                />
                                                <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-medium text-sm truncate">
                                                    Chương {chapter.chapterNumber}: {chapter.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {chapter.wordCount.toLocaleString()} từ •{" "}
                                                    {chapter.fileName}
                                                    {chapter.errorMessage && (
                                                        <span className="text-red-500 ml-2">
                                                            • {chapter.errorMessage}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {chapter.status === "pending" &&
                                        editingId !== chapter.id && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingId(chapter.id)}
                                                    title="Sửa"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    onClick={() => removeChapter(chapter.id)}
                                                    title="Xóa"
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>

                        {/* Upload progress */}
                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Đang upload...
                                    </span>
                                    <span className="font-medium">{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} />
                            </div>
                        )}
                    </>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isUploading}>
                        {successCount > 0 ? "Đóng" : "Hủy"}
                    </Button>
                    {pendingCount > 0 && (
                        <Button
                            onClick={handleUploadAll}
                            disabled={isUploading || pendingCount === 0}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang upload...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload {pendingCount} chương
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
