'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Download,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { createClientClient } from '@/lib/supabase'

interface Model {
  id: string
  prompt: string
  file_url: string | null
  preview_url: string | null
  status: string
  created_at: string
  parameters: any
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const supabase = createClientClient()

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        // Redirect to login
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading models:', error)
        return
      }

      setModels(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredModels = models.filter(model => {
    const matchesSearch = model.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || model.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />已完成</Badge>
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />生成中</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />失败</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownload = (model: Model) => {
    if (model.file_url) {
      window.open(model.file_url, '_blank')
    }
  }

  const handleOrderPrint = (modelId: string) => {
    window.location.href = `/orders/new?modelId=${modelId}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载模型中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">我的模型</h1>
              <p className="text-gray-600 mt-1">管理你创建的所有3D模型</p>
            </div>

            <Link href="/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建新模型
              </Button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索模型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">全部状态</option>
                <option value="completed">已完成</option>
                <option value="generating">生成中</option>
                <option value="failed">失败</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Models Grid */}
      <main className="container mx-auto px-4 py-8">
        {filteredModels.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || statusFilter !== 'all' ? '没有找到匹配的模型' : '还没有模型'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? '尝试调整搜索条件或筛选条件'
                : '开始创建你的第一个3D模型吧！'
              }
            </p>
            <Link href="/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建模型
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2">
                        {model.prompt || '未命名模型'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(model.created_at)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(model.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Model Preview */}
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                    {model.preview_url ? (
                      <img
                        src={model.preview_url}
                        alt="Model preview"
                        className="w-full h-full object-cover"
                      />
                    ) : model.status === 'completed' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                          <p className="text-sm">3D模型</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <Clock className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">生成中...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(model)}
                      disabled={model.status !== 'completed' || !model.file_url}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      下载
                    </Button>

                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOrderPrint(model.id)}
                      disabled={model.status !== 'completed'}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      打印
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
