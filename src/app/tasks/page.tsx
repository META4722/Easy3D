'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Trash2,
  RefreshCw,
  Search,
  Download,
  Eye,
  X,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react'
import Link from 'next/link'
import TaskDetailDialog from '@/components/TaskDetailDialog'

interface Task {
  task_id: string
  type: 'text_to_model' | 'image_to_model'
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
  prompt?: string
  created_time: number
  progress?: number
  model_url?: string
}

interface TasksResponse {
  tasks: Task[]
  total: number
  page: number
  limit: number
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [demo, setDemo] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/tasks?page=${page}&limit=20`)
      
      if (!response.ok) {
        throw new Error('获取任务列表失败')
      }

      const result = await response.json()
      
      if (result.success) {
        setTasks(result.data.tasks || [])
        setTotal(result.data.total || 0)
        setDemo(result.demo || false)
      } else {
        throw new Error(result.error || '获取任务列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务列表失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchTasks(false)
  }

  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('取消任务失败')
      }

      const result = await response.json()
      
      if (result.success) {
        // 更新本地状态
        setTasks(prev => prev.map(task => 
          task.task_id === taskId 
            ? { ...task, status: 'cancelled' as const }
            : task
        ))
      } else {
        throw new Error(result.error || '取消任务失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消任务失败')
    }
  }

  const handleDownloadModel = async (task: Task) => {
    if (!task.model_url) return

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
      setError('下载失败，请重试')
    }
  }

  const handleBatchCancel = async () => {
    if (selectedTasks.length === 0) return

    setBatchLoading(true)
    try {
      const response = await fetch('/api/tasks/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          taskIds: selectedTasks
        })
      })

      if (!response.ok) {
        throw new Error('批量取消失败')
      }

      const result = await response.json()
      
      if (result.success) {
        // 更新本地状态
        setTasks(prev => prev.map(task => 
          selectedTasks.includes(task.task_id)
            ? { ...task, status: 'cancelled' as const }
            : task
        ))
        setSelectedTasks([])
        
        if (result.errors.length > 0) {
          setError(`部分任务取消失败：${result.errors.length}/${result.summary.total}`)
        }
      } else {
        throw new Error(result.error || '批量取消失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量取消失败')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId])
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const cancellableTasks = filteredTasks
        .filter(task => task.status === 'queued' || task.status === 'running')
        .map(task => task.task_id)
      setSelectedTasks(cancellableTasks)
    } else {
      setSelectedTasks([])
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.task_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.prompt && task.prompt.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesType = typeFilter === 'all' || task.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">任务管理</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/generate">
              <Button variant="ghost">生成模型</Button>
            </Link>
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
        <div className="space-y-6">
          {/* 页面标题和操作 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">任务管理</h1>
              <p className="text-gray-600 mt-1">
                管理你的所有 3D 模型生成任务
                {demo && <span className="text-yellow-600 ml-2">(演示模式)</span>}
              </p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">总任务数</p>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">进行中</p>
                    <p className="text-2xl font-bold">
                      {tasks.filter(t => t.status === 'running' || t.status === 'queued').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">已完成</p>
                    <p className="text-2xl font-bold">
                      {tasks.filter(t => t.status === 'success').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">失败/取消</p>
                    <p className="text-2xl font-bold">
                      {tasks.filter(t => t.status === 'failed' || t.status === 'cancelled').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 快速操作面板 */}
          {tasks.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-sm">
                      <span className="text-gray-600">进行中任务：</span>
                      <span className="font-semibold text-blue-600 ml-1">
                        {tasks.filter(t => t.status === 'running' || t.status === 'queued').length}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">今日完成：</span>
                      <span className="font-semibold text-green-600 ml-1">
                        {tasks.filter(t => {
                          const today = new Date()
                          const taskDate = new Date(t.created_time)
                          return t.status === 'success' && 
                                 taskDate.toDateString() === today.toDateString()
                        }).length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const runningTasks = tasks.filter(t => t.status === 'running' || t.status === 'queued')
                        setSelectedTasks(runningTasks.map(t => t.task_id))
                      }}
                      disabled={tasks.filter(t => t.status === 'running' || t.status === 'queued').length === 0}
                    >
                      选择所有进行中任务
                    </Button>
                    <Link href="/generate">
                      <Button size="sm">
                        <Sparkles className="h-4 w-4 mr-2" />
                        新建任务
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 过滤和搜索 */}
          <Card>
            <CardHeader>
              <CardTitle>筛选任务</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索任务 ID 或描述..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="queued">排队中</SelectItem>
                    <SelectItem value="running">进行中</SelectItem>
                    <SelectItem value="success">已完成</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="类型筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有类型</SelectItem>
                    <SelectItem value="text_to_model">文本生成</SelectItem>
                    <SelectItem value="image_to_model">图片生成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 任务列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>任务列表</CardTitle>
                  <CardDescription>
                    共 {filteredTasks.length} 个任务
                    {selectedTasks.length > 0 && (
                      <span className="ml-2 text-blue-600">
                        已选择 {selectedTasks.length} 个
                      </span>
                    )}
                  </CardDescription>
                </div>
                
                {selectedTasks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={batchLoading}
                        >
                          {batchLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          批量取消 ({selectedTasks.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>批量取消任务</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要取消选中的 {selectedTasks.length} 个任务吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBatchCancel}>
                            确认批量取消
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedTasks([])}
                    >
                      取消选择
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <XCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>{error}</p>
                  <Button onClick={() => fetchTasks()} className="mt-4" variant="outline">
                    重试
                  </Button>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>暂无任务</p>
                  <Link href="/generate">
                    <Button className="mt-4">
                      开始生成模型
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedTasks.length > 0 && selectedTasks.length === filteredTasks.filter(task => task.status === 'queued' || task.status === 'running').length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded"
                          />
                        </TableHead>
                        <TableHead>任务 ID</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>描述/进度</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => {
                        const canSelect = task.status === 'queued' || task.status === 'running'
                        const isSelected = selectedTasks.includes(task.task_id)
                        
                        return (
                          <TableRow key={task.task_id}>
                            <TableCell>
                              {canSelect && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleSelectTask(task.task_id, e.target.checked)}
                                  className="rounded"
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              <button
                                onClick={() => {
                                  setDetailTaskId(task.task_id)
                                  setDetailDialogOpen(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {task.task_id.length > 20 
                                  ? `${task.task_id.substring(0, 20)}...` 
                                  : task.task_id
                                }
                              </button>
                            </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {task.type === 'text_to_model' ? '文本生成' : '图片生成'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(task.status)}
                          </TableCell>
                          <TableCell>
                            {task.prompt ? (
                              <div className="max-w-xs truncate" title={task.prompt}>
                                {task.prompt}
                              </div>
                            ) : task.status === 'running' && task.progress ? (
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm">{task.progress}%</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(task.created_time)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setDetailTaskId(task.task_id)
                                  setDetailDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {task.model_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadModel(task)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {(task.status === 'queued' || task.status === 'running') && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>取消任务</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        确定要取消这个任务吗？此操作无法撤销。
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>取消</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleCancelTask(task.task_id)}
                                      >
                                        确认取消
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 任务详情对话框 */}
      <TaskDetailDialog
        taskId={detailTaskId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  )
}