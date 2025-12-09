// Types cho Chapter API
export interface ChapterData {
  // Thông tin cơ bản
  id?: string;
  novelId: string;
  chapterNumber: number;
  title: string;

  // Nội dung
  content: string;                // HTML content từ editor
  contentJson?: object;           // JSON format (TipTap/ProseMirror)

  // Metadata
  wordCount: number;
  charCount: number;

  // Trạng thái
  status: 'draft' | 'published';
  isPublic: boolean;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;

  // Optional
  authorNote?: string;
  thumbnailUrl?: string;
}

export interface Novel {
  id: string;
  title: string;
  coverImage?: string;
  status: "Đang viết" | "Hoàn thành" | "Tạm dừng";
  chapters: number;
  views: number;
  likes: number;
  lastUpdated: string;
  genre?: string;
  description?: string;
}

export interface ChapterListItem {
  id: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  status: 'draft' | 'published';
  publishedAt?: string;
  updatedAt: string;
}

export interface ChapterListResponse {
  success: boolean;
  data: {
    chapters: ChapterListItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ChapterResponse {
  success: boolean;
  data: ChapterData;
  message: string;
}

export interface AutoSaveResponse {
  success: boolean;
  data: {
    savedAt: string;
  };
  message: string;
}

export interface PublishRequest {
  isPublic: boolean;
  scheduledAt?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}
