'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Package,
  MapPin,
  Calculator,
  Loader2,
  CheckCircle,
  Leaf,
  AlertCircle
} from 'lucide-react'
import { createClientClient } from '@/lib/supabase'
import ModelViewer from '@/components/ModelViewer'

interface Model {
  id: string
  prompt: string
  file_url: string | null
  preview_url: string | null
}

interface ShippingAddress {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
}

const MATERIALS = [
  {
    id: 'PLA',
    name: 'PLA (标准)',
    price: 15.00,
    description: '易用性好，适合初学者',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'PLA-Eco',
    name: 'PLA (环保回收)',
    price: 12.00,
    description: '环保材料，碳排放减少30%',
    color: 'bg-green-100 text-green-800',
    eco: true
  },
  {
    id: 'PETG',
    name: 'PETG (高强度)',
    price: 20.00,
    description: '强度高，透明度好',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'ABS',
    name: 'ABS (耐用)',
    price: 18.00,
    description: '耐冲击，适合功能件',
    color: 'bg-orange-100 text-orange-800'
  },
]

export default function NewOrderPage() {
  const searchParams = useSearchParams()
  const modelId = searchParams.get('modelId')

  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedMaterial, setSelectedMaterial] = useState('PLA-Eco')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: ''
  })

  const supabase = createClientClient()

  useEffect(() => {
    if (modelId) {
      loadModel()
    } else {
      setLoading(false)
      setError('未指定模型ID')
    }
  }, [modelId])

  const loadModel = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .eq('user_id', session.user.id)
        .single()

      if (error || !data) {
        setError('模型不存在或无权访问')
        return
      }

      if (data.status !== 'completed') {
        setError('模型尚未完成生成，无法下单')
        return
      }

      setModel(data)
    } catch (err) {
      setError('加载模型失败')
    } finally {
      setLoading(false)
    }
  }

  const selectedMaterialInfo = MATERIALS.find(m => m.id === selectedMaterial)
  const totalPrice = (selectedMaterialInfo?.price || 0) * quantity

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!model) return false
    if (!selectedMaterial || quantity < 1) return false
    if (!shippingAddress.name || !shippingAddress.phone ||
        !shippingAddress.province || !shippingAddress.city ||
        !shippingAddress.detail) return false
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('请填写完整的订单信息')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: model!.id,
          material: selectedMaterial,
          quantity,
          shippingAddress,
          notes
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '订单提交失败')
      }

      const result = await response.json()

      if (result.success) {
        // Redirect to orders page with success message
        window.location.href = `/orders?success=true&orderId=${result.orderId}`
      } else {
        throw new Error(result.error || '支付失败')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '订单提交失败')
    } finally {
      setSubmitting(false)
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

  if (error && !model) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>返回</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">创建订单</h1>
          <p className="text-gray-600 mt-1">配置打印参数并下单</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Order Form */}
          <div className="space-y-6">
            {/* Model Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  模型信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                {model && (
                  <div className="flex gap-4">
                    {model.preview_url ? (
                      <img
                        src={model.preview_url}
                        alt="Model preview"
                        className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium line-clamp-2">{model.prompt}</h3>
                      <p className="text-sm text-gray-600 mt-1">模型ID: {model.id.slice(-8)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Material Selection */}
            <Card>
              <CardHeader>
                <CardTitle>选择材料</CardTitle>
                <CardDescription>不同材料适用于不同的使用场景</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {MATERIALS.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => setSelectedMaterial(material.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMaterial === material.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{material.name}</h4>
                            {material.eco && (
                              <Badge className="bg-green-100 text-green-800">
                                <Leaf className="w-3 h-3 mr-1" />
                                环保
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">¥{material.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">每件</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quantity */}
            <Card>
              <CardHeader>
                <CardTitle>数量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label htmlFor="quantity">打印数量:</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  收货地址
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">收货人姓名</Label>
                    <Input
                      id="name"
                      value={shippingAddress.name}
                      onChange={(e) => handleAddressChange('name', e.target.value)}
                      placeholder="请输入收货人姓名"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">手机号码</Label>
                    <Input
                      id="phone"
                      value={shippingAddress.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="请输入手机号码"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="province">省份</Label>
                    <Input
                      id="province"
                      value={shippingAddress.province}
                      onChange={(e) => handleAddressChange('province', e.target.value)}
                      placeholder="省份"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">城市</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="城市"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">区县</Label>
                    <Input
                      id="district"
                      value={shippingAddress.district}
                      onChange={(e) => handleAddressChange('district', e.target.value)}
                      placeholder="区县"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="detail">详细地址</Label>
                  <Input
                    id="detail"
                    value={shippingAddress.detail}
                    onChange={(e) => handleAddressChange('detail', e.target.value)}
                    placeholder="请输入详细地址"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">备注 (可选)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="有什么特殊要求可以在这里说明..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview & Summary */}
          <div className="space-y-6">
            {/* Model Preview */}
            {model?.file_url && (
              <Card>
                <CardHeader>
                  <CardTitle>模型预览</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ModelViewer
                    modelUrl={model.file_url}
                    className="h-80"
                  />
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  订单汇总
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>材料:</span>
                    <span>{selectedMaterialInfo?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>单价:</span>
                    <span>¥{selectedMaterialInfo?.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>数量:</span>
                    <span>{quantity} 件</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>配送费:</span>
                    <span>免费</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                    <span>总计:</span>
                    <span className="text-blue-600">¥{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {selectedMaterial === 'PLA-Eco' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800">
                      <Leaf className="h-4 w-4" />
                      <span className="text-sm font-medium">环保贡献</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      选择环保材料，预计减少碳排放 30%
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!validateForm() || submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      立即支付 ¥{totalPrice.toFixed(2)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  点击支付即表示同意服务条款和隐私政策
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
