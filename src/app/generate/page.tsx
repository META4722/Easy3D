'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import ModelViewer from '@/components/ModelViewer'
import {
  Upload,
  Sparkles,
  Loader2,
  Settings,
  Download,
  ShoppingCart,
  Leaf,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { log } from 'console'

interface GeneratedModel {
  id: string
  file_url: string
  preview_url?: string
  status: string
  demo?: boolean
  task_id?: string
  progress?: number
}

interface ModelParameters {
  scale: number
  detail: number
  density: number
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageToken, setImageToken] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedModel, setGeneratedModel] = useState<GeneratedModel | null>(null)
  const [error, setError] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')
  const [taskStatus, setTaskStatus] = useState<string>('')
  const [taskProgress, setTaskProgress] = useState<number>(0)
  const [parameters, setParameters] = useState<ModelParameters>({
    scale: 1.0,
    detail: 0.5,
    density: 0.7
  })

  const uploadImageToTripo3D = async (file: File) => {

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })



      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '上传失败')
      }

      // 设置图片token和预览
      setImageToken(result.data.image_token)

      setUploadedImage(file)

      // 创建本地预览
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      uploadImageToTripo3D(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1
  })

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    console.log("开始轮询任务状态:", taskId)

    const poll = async () => {
      try {
        const response = await fetch(`/api/task-status?taskId=${taskId}`)

        if (!response.ok) {
          throw new Error('获取任务状态失败')
        }

        const result = await response.json()
        console.log("任务状态:", result)

        if (result.success) {
          const { status, progress, model } = result.data

          setTaskStatus(status)
          setTaskProgress(progress || 0)

          // 根据状态更新UI
          switch (status) {
            case 'queued':
              console.log("任务排队中...")
              break
            case 'running':
              console.log(`任务进行中... ${progress}%`)
              break
            case 'success':
              console.log("任务完成!")
              setIsGenerating(false)
              setGeneratedModel({
                id: taskId,
                file_url: model?.model_url || '',
                preview_url: model?.preview_url || '',
                status: 'completed',
                task_id: taskId,
                progress: 100,
                demo: result.demo
              })
              return // 停止轮询
            case 'failed':
            case 'cancelled':
              console.log("任务失败或被取消")
              setIsGenerating(false)
              setError(`任务${status === 'failed' ? '失败' : '被取消'}`)
              return // 停止轮询
          }

          // 如果任务还在进行中，继续轮询
          if (status === 'queued' || status === 'running') {
            setTimeout(poll, 3000) // 3秒后再次查询
          }
        }
      } catch (err) {
        console.error('轮询任务状态失败:', err)
        setTimeout(poll, 5000) // 出错后5秒重试
      }
    }

    // 开始轮询
    poll()
  }

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageToken) {
      setError('请输入描述文本或上传图片')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedModel(null)
    setTaskId('')
    setTaskStatus('')
    setTaskProgress(0)

    try {
      const response = await fetch('/api/generate-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageToken: imageToken || null,
          parameters
        }),
      })

      if (!response.ok) {
        throw new Error('生成失败，请重试')
      }

      const result = await response.json()
      console.log("生成结果:", result)

      if (result.success && result.data?.task_id) {
        const newTaskId = result.data.task_id
        setTaskId(newTaskId)
        setTaskStatus('queued')

        // 开始轮询任务状态
        pollTaskStatus(newTaskId)
      } else {
        // 如果是演示模式，直接设置结果
        if (result.demo) {
          setGeneratedModel({
            id: result.data?.task_id || 'demo',
            file_url: 'https://storage.googleapis.com/3d-model-samples/sample.glb',
            preview_url: 'https://storage.googleapis.com/3d-model-samples/sample-preview.jpg',
            status: 'completed',
            demo: true
          })
          setIsGenerating(false)
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
      setIsGenerating(false)
    }
  }

  const handleParameterChange = (param: keyof ModelParameters, value: number) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }))
  }

  const handleDownloadModel = async () => {
    if (!generatedModel?.file_url) return

    try {
      const filename = `model_${generatedModel.id}.glb`
      const downloadUrl = `/api/download-model?url=${encodeURIComponent(generatedModel.file_url)}&filename=${filename}`

      // 创建下载链接
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("开始下载模型:", filename)
    } catch (err) {
      console.error('下载失败:', err)
      setError('模型下载失败，请重试')
    }
  }

  const handleOrderPrint = () => {
    if (!generatedModel) return
    // Navigate to order page with model ID
    window.location.href = `/orders/new?modelId=${generatedModel.id}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">AI生成器</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/models">
              <Button variant="ghost">我的模型</Button>
            </Link>
            <Link href="/orders">
              <Button variant="ghost">订单</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  描述你的想法
                </CardTitle>
                <CardDescription>
                  用文字描述或上传图片，AI将为你生成专业的3D模型
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">文字描述</Label>
                  <Textarea
                    id="prompt"
                    placeholder="例如：一个可爱的小猫咪手机支架，有着大眼睛和微笑表情..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="text-center text-gray-500">或者</div>

                <div>
                  <Label>上传参考图片</Label>
                  <div
                    {...getRootProps()}
                    className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : isUploading
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <input {...getInputProps()} disabled={isUploading} />
                    {isUploading ? (
                      <div className="space-y-3">
                        <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
                        <p className="text-gray-600">上传中...</p>
                      </div>
                    ) : imagePreview ? (
                      <div className="space-y-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded"
                        />
                        <p className="text-sm text-gray-600">点击或拖拽更换图片</p>
                        {imageToken && (
                          <p className="text-xs text-green-600">✓ 图片已上传成功</p>
                        )}
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

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!prompt.trim() && !imageToken)}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      开始生成 (约10秒)
                    </>
                  )}
                </Button>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Leaf className="h-5 w-5" />
                  环保提示
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-sm">
                  选择 PLA 回收料材质可减少 30% 碳排放，为环保贡献一份力量！
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>3D预览</CardTitle>
                  <CardDescription>
                    {generatedModel ? '拖拽旋转查看模型' : '生成完成后将在此显示3D模型'}
                  </CardDescription>
                </div>

                {generatedModel && (
                  <div className="flex gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          参数调整
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>模型参数</SheetTitle>
                          <SheetDescription>
                            调整参数后点击重新生成来应用更改
                          </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6 mt-6">
                          <div>
                            <Label>缩放比例: {parameters.scale}x</Label>
                            <Slider
                              value={[parameters.scale]}
                              onValueChange={([value]) => handleParameterChange('scale', value)}
                              min={0.5}
                              max={2.0}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>细节级别: {Math.round(parameters.detail * 100)}%</Label>
                            <Slider
                              value={[parameters.detail]}
                              onValueChange={([value]) => handleParameterChange('detail', value)}
                              min={0.1}
                              max={1.0}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>网格密度: {Math.round(parameters.density * 100)}%</Label>
                            <Slider
                              value={[parameters.density]}
                              onValueChange={([value]) => handleParameterChange('density', value)}
                              min={0.3}
                              max={1.0}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-0">
                {generatedModel ? (
                  <div className="relative">
                    <ModelViewer
                      modelUrl={generatedModel.file_url}
                      className="h-96"
                    />
                    {generatedModel.demo && (
                      <Badge
                        variant="secondary"
                        className="absolute top-4 left-4 bg-yellow-100 text-yellow-800"
                      >
                        演示模式
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="h-96 bg-gray-100 flex items-center justify-center text-gray-500">
                    {isGenerating ? (
                      <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                        <p>AI正在生成你的3D模型...</p>
                        {taskStatus && (
                          <div className="space-y-2">
                            <p className="text-sm">
                              状态: {
                                taskStatus === 'queued' ? '排队中' :
                                  taskStatus === 'running' ? '生成中' :
                                    taskStatus === 'success' ? '完成' :
                                      taskStatus === 'failed' ? '失败' :
                                        taskStatus === 'cancelled' ? '已取消' : taskStatus
                              }
                            </p>
                            {taskProgress > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${taskProgress}%` }}
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              {taskProgress > 0 ? `${taskProgress}%` : '请耐心等待...'}
                            </p>
                          </div>
                        )}
                        {!taskStatus && (
                          <p className="text-sm">这通常需要30-60秒</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>等待生成3D模型</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {generatedModel && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleDownloadModel}
                  disabled={!generatedModel.file_url}
                >
                  <Download className="h-4 w-4" />
                  下载模型
                </Button>

                <Button
                  onClick={handleOrderPrint}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  下单打印
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
