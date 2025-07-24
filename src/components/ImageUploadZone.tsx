'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'

interface ImageUploadZoneProps {
  onImageUploaded: (imageToken: string, previewUrl: string) => void
  onError: (error: string) => void
  disabled?: boolean
  currentImage?: string | null
}

interface UploadState {
  isUploading: boolean
  progress: number
  imageToken: string | null
  previewUrl: string | null
  error: string | null
}

export default function ImageUploadZone({ 
  onImageUploaded, 
  onError, 
  disabled = false,
  currentImage = null
}: ImageUploadZoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    imageToken: null,
    previewUrl: currentImage,
    error: null
  })

  const uploadImage = async (file: File) => {
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null
    }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 200)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      // 创建本地预览URL
      const previewUrl = URL.createObjectURL(file)

      setUploadState({
        isUploading: false,
        progress: 100,
        imageToken: result.data.image_token,
        previewUrl: previewUrl,
        error: null
      })

      // 通知父组件
      onImageUploaded(result.data.image_token, previewUrl)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }))

      onError(errorMessage)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      uploadImage(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: disabled || uploadState.isUploading
  })

  const clearImage = () => {
    if (uploadState.previewUrl) {
      URL.revokeObjectURL(uploadState.previewUrl)
    }
    setUploadState({
      isUploading: false,
      progress: 0,
      imageToken: null,
      previewUrl: null,
      error: null
    })
  }

  const retryUpload = () => {
    setUploadState(prev => ({
      ...prev,
      error: null
    }))
  }

  return (
    <div className="space-y-2">
      <Label>上传参考图片</Label>
      
      <div
        {...getRootProps()}
        className={`
          mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : uploadState.error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${(disabled || uploadState.isUploading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadState.isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
            <div>
              <p className="text-gray-600">上传中...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadState.progress}%</p>
            </div>
          </div>
        ) : uploadState.error ? (
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <p className="text-red-600 mb-2">{uploadState.error}</p>
              <Button 
                onClick={retryUpload}
                variant="outline" 
                size="sm"
              >
                重试上传
              </Button>
            </div>
          </div>
        ) : uploadState.previewUrl ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={uploadState.previewUrl}
                alt="Preview"
                className="max-h-32 mx-auto rounded"
              />
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  clearImage()
                }}
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">点击或拖拽更换图片</p>
              {uploadState.imageToken && (
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-green-600">图片已上传成功</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-600">
                {isDragActive ? '释放文件' : '点击或拖拽图片到此处'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支持 PNG, JPG, JPEG, WebP 格式
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}