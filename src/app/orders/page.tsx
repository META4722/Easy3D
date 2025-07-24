'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  MapPin,
  Calendar,
  Printer,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { createClientClient } from '@/lib/supabase'

interface Order {
  id: string
  model_id: string
  material: string
  quantity: number
  price: number
  status: string
  shipping_address: any
  notes: string | null
  created_at: string
  updated_at: string
  models?: {
    prompt: string
    preview_url: string | null
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientClient()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          models (
            prompt,
            preview_url
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading orders:', error)
        return
      }

      setOrders(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAddress = (address: any) => {
    if (typeof address === 'string') {
      return address
    }
    return `${address?.province || ''} ${address?.city || ''} ${address?.district || ''} ${address?.detail || ''}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载订单中...</p>
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
              <h1 className="text-3xl font-bold">我的订单</h1>
              <p className="text-gray-600 mt-1">查看和管理你的打印订单</p>
            </div>

            <Link href="/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建新订单
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Orders List */}
      <main className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">还没有订单</h3>
            <p className="text-gray-600 mb-6">
              生成3D模型后即可下单打印
            </p>
            <Link href="/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                开始创建
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        订单 #{order.id.slice(-8)}
                        {getStatusBadge(order.status)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          ¥{order.price.toFixed(2)}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Model Info */}
                    <div className="md:col-span-1">
                      <h4 className="font-medium mb-3">模型信息</h4>
                      <div className="space-y-3">
                        {order.models?.preview_url ? (
                          <img
                            src={order.models.preview_url}
                            alt="Model preview"
                            className="w-full aspect-video object-cover rounded-lg bg-gray-100"
                          />
                        ) : (
                          <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {order.models?.prompt || '3D模型'}
                        </p>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="md:col-span-1">
                      <h4 className="font-medium mb-3">订单详情</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">材料:</span>
                          <span>{order.material}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">数量:</span>
                          <span>{order.quantity} 件</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">单价:</span>
                          <span>¥{(order.price / order.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>总计:</span>
                          <span>¥{order.price.toFixed(2)}</span>
                        </div>
                        {order.notes && (
                          <div className="pt-2">
                            <span className="text-gray-600">备注:</span>
                            <p className="text-sm mt-1">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="md:col-span-1">
                      <h4 className="font-medium mb-3">配送信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p>{formatAddress(order.shipping_address)}</p>
                            {typeof order.shipping_address === 'object' && (
                              <>
                                <p className="text-gray-600">
                                  {order.shipping_address.name} {order.shipping_address.phone}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Timeline */}
                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-2">订单状态</h5>
                        <div className="space-y-2">
                          <div className={`text-xs flex items-center gap-2 ${
                            ['paid', 'printing', 'shipped', 'completed'].includes(order.status)
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              ['paid', 'printing', 'shipped', 'completed'].includes(order.status)
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                            }`} />
                            支付完成
                          </div>
                          <div className={`text-xs flex items-center gap-2 ${
                            ['printing', 'shipped', 'completed'].includes(order.status)
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              ['printing', 'shipped', 'completed'].includes(order.status)
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                            }`} />
                            开始打印
                          </div>
                          <div className={`text-xs flex items-center gap-2 ${
                            ['shipped', 'completed'].includes(order.status)
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              ['shipped', 'completed'].includes(order.status)
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                            }`} />
                            已发货
                          </div>
                          <div className={`text-xs flex items-center gap-2 ${
                            order.status === 'completed'
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              order.status === 'completed'
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                            }`} />
                            已完成
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status === 'pending' && (
                    <div className="mt-6 pt-6 border-t flex gap-3">
                      <Button size="sm">继续支付</Button>
                      <Button variant="outline" size="sm">取消订单</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
