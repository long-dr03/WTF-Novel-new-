/**
 * Tùy chọn soạn thảo của tác giả — lưu trên trình duyệt (localStorage).
 * Không cần backend. Editor (WriteNovelV2) đọc các giá trị này khi tạo/lưu chương.
 */
export interface AuthorPrefs {
    /** Trạng thái mặc định khi tạo chương mới */
    defaultChapterStatus: 'draft' | 'published';
    /** Cảnh báo nếu chương dưới số từ này (0 = tắt) */
    minWords: number;
    /** Lời tác giả mặc định, tự gắn vào chương mới */
    defaultAuthorNote: string;
}

const KEY = 'gocaudio:author-prefs';

export const DEFAULT_AUTHOR_PREFS: AuthorPrefs = {
    defaultChapterStatus: 'draft',
    minWords: 0,
    defaultAuthorNote: '',
};

export function getAuthorPrefs(): AuthorPrefs {
    if (typeof window === 'undefined') return { ...DEFAULT_AUTHOR_PREFS };
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? { ...DEFAULT_AUTHOR_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_AUTHOR_PREFS };
    } catch {
        return { ...DEFAULT_AUTHOR_PREFS };
    }
}

export function setAuthorPrefs(patch: Partial<AuthorPrefs>): AuthorPrefs {
    const next = { ...getAuthorPrefs(), ...patch };
    if (typeof window !== 'undefined') {
        localStorage.setItem(KEY, JSON.stringify(next));
    }
    return next;
}
