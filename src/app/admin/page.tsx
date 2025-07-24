'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  Printer,
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Send
} from 'lucide-react'
import { createClientClient } from '@/lib/supabase'

interface Order {
  id: string
  user_id: string
  model_id: string
  material: string
  quantity: number
  price: number
  status: string
  shipping_address: any
  created_at: string
  updated_at: string
  models?: {
    prompt: string
    preview_url: string | null
  }
  users?: {
    email: string
    username: string | null
  }
}

interface Stats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  printingOrders: number
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    printingOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sendingToPrint, setSendingToPrint] = useState<Set<string>>(new Set())

  const supabase = createClientClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.href = '/login'
        return
      }

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (user?.role !== 'admin') {
        // Redirect to unauthorized page
        window.location.href = '/?error=unauthorized'
        return
      }

      await loadData()
    } catch (error) {
      console.error('Error checking admin access:', error)
      window.location.href = '/?error=unauthorized'
    }
  }

  const loadData = async () => {
    try {
      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          models (
            prompt,
            preview_url
          ),
          users (
            email,
            username
          )
        `)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error loading orders:', ordersError)
        return
      }

      setOrders(ordersData || [])

      // Calculate stats
      const stats = (ordersData || []).reduce((acc, order) => {
        acc.totalOrders++
        acc.totalRevenue += order.price
        if (order.status === 'paid') acc.pendingOrders++
        if (order.status === 'printing') acc.printingOrders++
        return acc
      }, {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        printingOrders: 0
      })

      setStats(stats)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.models?.prompt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.users?.email || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />待支付</Badge>
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800"><CreditCard className="w-3 h-3 mr-1" />已支付</Badge>
      case 'printing':
        return <Badge className="bg-purple-100 text-purple-800"><Printer className="w-3 h-3 mr-1" />打印中</Badge>
      case 'shipped':
        return <Badge className="bg-green-100 text-green-800"><Truck className="w-3 h-3 mr-1" />已发货</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />已完成</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">已取消</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSendToPrint = async (orderId: string) => {
    setSendingToPrint(prev => new Set([...prev, orderId]))

    try {
      const response = await fetch('/api/send-to-print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        throw new Error('发送到打印机失败')
      }

      // Update order status locally
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: 'printing', updated_at: new Date().toISOString() }
          : order
      ))

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingOrders: prev.pendingOrders - 1,
        printingOrders: prev.printingOrders + 1
      }))

    } catch (error) {
      console.error('Error sending to print:', error)
      alert('发送失败，请重试')
    } finally {
      setSendingToPrint(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">管理员控制台</h1>
              <p className="text-gray-600 mt-1">订单管理和打印机队列</p>
            </div>

            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新数据
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总收入</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">等待打印</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">打印中</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.printingOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>订单管理</CardTitle>
                <CardDescription>查看所有订单并管理打印队列</CardDescription>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索订单ID、模型描述或用户邮箱..."
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
                  <option value="paid">已支付</option>
                  <option value="printing">打印中</option>
                  <option value="shipped">已发货</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">没有找到匹配的订单</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid md:grid-cols-12 gap-4 items-center">
                      {/* Order Info */}
                      <div className="md:col-span-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">#{order.id.slice(-8)}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      {/* Model */}
                      <div className="md:col-span-3">
                        <p className="font-medium line-clamp-1">
                          {order.models?.prompt || '3D模型'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.material} × {order.quantity}
                        </p>
                      </div>

                      {/* User */}
                      <div className="md:col-span-2">
                        <p className="text-sm">
                          {order.users?.username || order.users?.email || '未知用户'}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="md:col-span-2">
                        <p className="font-semibold">¥{order.price.toFixed(2)}</p>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-2">
                        {order.status === 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendToPrint(order.id)}
                            disabled={sendingToPrint.has(order.id)}
                            className="w-full"
                          >
                            {sendingToPrint.has(order.id) ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                发送中...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                发送打印
                              </>
                            )}
                          </Button>
                        )}

                        {order.status === 'printing' && (
                          <Badge className="bg-purple-100 text-purple-800 w-full justify-center">
                            <Printer className="w-3 h-3 mr-1" />
                            队列中
                          </Badge>
                        )}

                        {['shipped', 'completed'].includes(order.status) && (
                          <Badge className="bg-green-100 text-green-800 w-full justify-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            已完成
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
