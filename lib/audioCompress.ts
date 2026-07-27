/**
 * Nén audio -> MP3 mono NGAY TRÊN TRÌNH DUYỆT (không đụng server/VPS).
 *
 * Truyện audio là giọng đọc (băng tần hẹp) nên 96kbps mono gần như không mất chất
 * mà file nhẹ hơn nhiều. Chỉ bản đã nén mới được upload -> R2 chỉ lưu bản nhẹ.
 * MP3 phát được trên MỌI thiết bị (kể cả iPhone cũ).
 */

export interface CompressProgress {
    (percent: number): void;
}

/**
 * Nén 1 file audio sang MP3 mono.
 * @throws nếu trình duyệt không decode được file (gọi bên ngoài nên bắt lỗi để fallback dùng file gốc).
 */
export async function compressAudioToMp3(
    input: File,
    opts: { bitrate?: number; onProgress?: CompressProgress } = {}
): Promise<File> {
    const { bitrate = 96, onProgress } = opts;

    // 1) Giải mã file -> PCM. Ép về 44.1kHz (rate hợp lệ cho MP3 & đủ cho giọng đọc).
    const arrayBuffer = await input.arrayBuffer();
    const AudioCtx: typeof AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
    let ctx: AudioContext;
    try {
        ctx = new AudioCtx({ sampleRate: 44100 });
    } catch {
        ctx = new AudioCtx();
    }
    let audioBuffer: AudioBuffer;
    try {
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } finally {
        // giải phóng context sớm
        try { await ctx.close(); } catch { /* ignore */ }
    }

    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const numCh = audioBuffer.numberOfChannels;

    // 2) Downmix về mono + chuyển Float32[-1,1] -> Int16
    const ch0 = audioBuffer.getChannelData(0);
    const ch1 = numCh > 1 ? audioBuffer.getChannelData(1) : null;
    const int16 = new Int16Array(length);
    for (let i = 0; i < length; i++) {
        let s = ch1 ? (ch0[i] + ch1[i]) * 0.5 : ch0[i];
        if (s > 1) s = 1; else if (s < -1) s = -1;
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // 3) Encode MP3 mono (import động để không nặng bundle chính)
    const mod: any = await import('@breezystack/lamejs');
    const Mp3Encoder = mod.Mp3Encoder ?? mod.default?.Mp3Encoder ?? mod.default;
    const encoder = new Mp3Encoder(1, sampleRate, bitrate);

    const blockSize = 1152; // 1 frame MP3
    const parts: BlobPart[] = [];
    let counter = 0;
    for (let i = 0; i < int16.length; i += blockSize) {
        const block = int16.subarray(i, i + blockSize);
        const buf = encoder.encodeBuffer(block);
        if (buf.length > 0) parts.push(new Uint8Array(buf));
        // Nhường main thread định kỳ để UI không đơ, đồng thời cập nhật %
        if (++counter % 300 === 0) {
            onProgress?.(Math.round((i / int16.length) * 100));
            await new Promise((r) => setTimeout(r, 0));
        }
    }
    const end = encoder.flush();
    if (end.length > 0) parts.push(new Uint8Array(end));
    onProgress?.(100);

    const blob = new Blob(parts, { type: 'audio/mpeg' });
    const name = input.name.replace(/\.[^.]+$/, '') + '.mp3';
    return new File([blob], name, { type: 'audio/mpeg' });
}
