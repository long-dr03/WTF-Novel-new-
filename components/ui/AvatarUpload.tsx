"use client"

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import { useDropzone } from 'react-dropzone'
import { Upload, X, RotateCw, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react'
import 'react-image-crop/dist/ReactCrop.css'
import './avatar-upload.css'

interface AvatarUploadProps {
    value?: File
    defaultPreview?: string
    onChange: (file: File) => void
    onError?: (error: string) => void
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export function AvatarUpload({ value, defaultPreview, onChange, onError }: AvatarUploadProps) {
    const [imgSrc, setImgSrc] = useState<string>('')
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<Crop>()
    const [scale, setScale] = useState(1)
    const [rotate, setRotate] = useState(0)
    const [aspect] = useState<number>(1)
    const [filter, setFilter] = useState<string>('none')
    const [brightness, setBrightness] = useState(100)
    const [contrast, setContrast] = useState(100)
    const imgRef = useRef<HTMLImageElement>(null)
    const [preview, setPreview] = useState<string>(defaultPreview || '')
    const [isProcessing, setIsProcessing] = useState(false)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0]

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                onError?.('Kích thước ảnh không được vượt quá 5MB')
                return
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                onError?.('Vui lòng chọn file ảnh hợp lệ')
                return
            }

            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '')
            })
            reader.readAsDataURL(file)
        }
    }, [onError])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
        },
        maxFiles: 1,
        multiple: false
    })

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height, aspect))
    }

    const handleRotate = () => {
        setRotate((prev) => (prev + 90) % 360)
    }

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.1, 3))
    }

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.1, 0.5))
    }

    const getCroppedImg = useCallback(async () => {
        if (!imgRef.current || !completedCrop) return

        setIsProcessing(true)

        const image = imgRef.current
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            setIsProcessing(false)
            return
        }

        const scaleX = image.naturalWidth / image.width
        const scaleY = image.naturalHeight / image.height

        const cropWidth = completedCrop.width * scaleX
        const cropHeight = completedCrop.height * scaleY

        canvas.width = cropWidth
        canvas.height = cropHeight

        ctx.imageSmoothingQuality = 'high'

        // Apply filters
        let filterString = ''
        if (filter !== 'none') {
            switch (filter) {
                case 'grayscale':
                    filterString = 'grayscale(100%)'
                    break
                case 'sepia':
                    filterString = 'sepia(100%)'
                    break
                case 'blur':
                    filterString = 'blur(2px)'
                    break
            }
        }
        filterString += ` brightness(${brightness}%) contrast(${contrast}%)`
        ctx.filter = filterString

        const centerX = cropWidth / 2
        const centerY = cropHeight / 2

        ctx.save()

        // Move to center, rotate, then move back
        ctx.translate(centerX, centerY)
        ctx.rotate((rotate * Math.PI) / 180)
        ctx.scale(scale, scale)
        ctx.translate(-centerX, -centerY)

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight,
        )

        ctx.restore()

        canvas.toBlob((blob) => {
            if (!blob) {
                setIsProcessing(false)
                return
            }

            const file = new File([blob], 'avatar.png', { type: 'image/png' })
            onChange(file)

            const previewUrl = URL.createObjectURL(blob)
            setPreview(previewUrl)
            setIsProcessing(false)
        }, 'image/png', 0.95)
    }, [completedCrop, scale, rotate, filter, brightness, contrast, onChange])

    const handleReset = () => {
        setImgSrc('')
        setPreview(defaultPreview || '')
        setCrop(undefined)
        setCompletedCrop(undefined)
        setScale(1)
        setRotate(0)
        setFilter('none')
        setBrightness(100)
        setContrast(100)
    }

    return (
        <div className="avatar-upload-container">
            {!imgSrc ? (
                <div
                    {...getRootProps()}
                    className={`avatar-dropzone ${isDragActive ? 'active' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="dropzone-content">
                        {preview ? (
                            <div className="preview-wrapper">
                                <img src={preview} alt="Avatar preview" className="avatar-preview" />
                                <div className="overlay">
                                    <Upload className="icon" />
                                    <p className="text">Thay đổi ảnh đại diện</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <ImageIcon className="upload-icon" />
                                <p className="upload-text">
                                    {isDragActive
                                        ? 'Thả ảnh vào đây...'
                                        : 'Kéo thả ảnh hoặc click để chọn'}
                                </p>
                                <p className="upload-hint">PNG, JPG, WEBP, GIF (tối đa 5MB)</p>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="crop-container">
                    <div className="crop-header">
                        <h3>Chỉnh sửa ảnh</h3>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="close-btn"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="crop-wrapper">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            circularCrop
                        >
                            <img
                                ref={imgRef}
                                alt="Crop preview"
                                src={imgSrc}
                                style={{
                                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                                    filter: `${filter === 'grayscale'
                                            ? 'grayscale(100%)'
                                            : filter === 'sepia'
                                                ? 'sepia(100%)'
                                                : filter === 'blur'
                                                    ? 'blur(2px)'
                                                    : ''
                                        } brightness(${brightness}%) contrast(${contrast}%)`,
                                }}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    </div>

                    <div className="controls-container">
                        {/* Zoom Controls */}
                        <div className="control-group">
                            <label className="control-label">Zoom</label>
                            <div className="control-buttons">
                                <button type="button" onClick={handleZoomOut} className="control-btn">
                                    <ZoomOut size={18} />
                                </button>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={scale}
                                    onChange={(e) => setScale(Number(e.target.value))}
                                    className="slider"
                                />
                                <button type="button" onClick={handleZoomIn} className="control-btn">
                                    <ZoomIn size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Rotate */}
                        <div className="control-group">
                            <label className="control-label">Xoay</label>
                            <button type="button" onClick={handleRotate} className="control-btn">
                                <RotateCw size={18} />
                                <span>{rotate}°</span>
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="control-group">
                            <label className="control-label">Bộ lọc</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="none">Không</option>
                                <option value="grayscale">Đen trắng</option>
                                <option value="sepia">Sepia</option>
                                <option value="blur">Mờ</option>
                            </select>
                        </div>

                        {/* Brightness */}
                        <div className="control-group">
                            <label className="control-label">Độ sáng: {brightness}%</label>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                value={brightness}
                                onChange={(e) => setBrightness(Number(e.target.value))}
                                className="slider"
                            />
                        </div>

                        {/* Contrast */}
                        <div className="control-group">
                            <label className="control-label">Độ tương phản: {contrast}%</label>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                value={contrast}
                                onChange={(e) => setContrast(Number(e.target.value))}
                                className="slider"
                            />
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="btn btn-secondary"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={getCroppedImg}
                            className="btn btn-primary"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Đang xử lý...' : 'Áp dụng'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
