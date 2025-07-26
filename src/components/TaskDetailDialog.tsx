'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Copy,
  ExternalLink
} from 'lucide-react'

interface Task {
  task_id: string
  type: 'text_to_model' | 'image_to_model'
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
  prompt?: string
  created_time: number
  progress?: number
  model_url?: string
}

interface TaskDetailDialogProps {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TaskDetailDialog({ taskId, open, onOpenChange }: TaskDetailDialogProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const fetchTaskDetail = async (id: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/tasks/${id}`)
      
      if (!response.ok) {
        throw new Error('获取任务详情失败')
      }

      const result = await response.json()
      
      if (result.success) {
        setTask(result.data)
      } else {
        throw new Error(result.error || '获取任务详情失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (taskId && open) {
      fetchTaskDetail(taskId)
    }
  }, [taskId, open])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'cancelled':
        return <Pause className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      queued: 'secondary',
      running: 'default',
      success: 'default',
      failed: 'destructive',
      cancelled: 'outline'
    } as const

    const labels = {
      queued: '排队中',
      running: '进行中',
      success: '已完成',
      failed: '失败',
      cancelled: '已取消'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleDownloadModel = async () => {
    if (!task?.model_url) return

    try {
      const filename = `model_${task.task_id}.glb`
      const downloadUrl = `/api/download-model?url=${encodeURIComponent(task.model_url)}&filename=${filename}`
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('下载失败:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>任务详情</DialogTitle>
          <DialogDescription>
            查看任务的详细信息和状态
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">加载中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : task ? (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">基本信息</h3>
                {getStatusBadge(task.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">任务 ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                      {task.task_id}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(task.task_id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">任务类型</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {task.type === 'text_to_model' ? '文本生成' : '图片生成'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">创建时间</label>
                  <p className="text-sm mt-1">{formatDate(task.created_time)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">进度</label>
                  <div className="mt-1">
                    {task.status === 'running' && task.progress ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-sm">{task.progress}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {task.status === 'success' ? '100%' : '-'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 任务内容 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">任务内容</h3>
              
              {task.prompt ? (
                <div>
                  <label className="text-sm font-medium text-gray-600">描述文本</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{task.prompt}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-600">输入类型</label>
                  <p className="text-sm mt-1 text-gray-500">图片输入</p>
                </div>
              )}
            </div>

            {/* 结果 */}
            {task.model_url && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">生成结果</h3>
                  
                  <div className="flex items-center gap-4">
                    <Button onClick={handleDownloadModel}>
                      <Download className="h-4 w-4 mr-2" />
                      下载模型
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <a href={task.model_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        查看原始链接
                      </a>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}