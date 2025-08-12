import { Suspense } from 'react'
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
import { createServerClient } from '@/lib/supabase'
import ModelViewer from '@/components/ModelViewer'
import NewOrderForm from '@/components/NewOrderForm'

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

interface PageProps {
  searchParams: Promise<{ modelId?: string }>
}

async function getModel(modelId: string) {
  const supabase = createServerClient()
  
  try {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .single()

    if (error || !data) {
      return null
    }

    if (data.status !== 'completed') {
      return null
    }

    return data
  } catch (err) {
    return null
  }
}

export default async function NewOrderPage({ searchParams }: PageProps) {
  const { modelId } = await searchParams
  
  if (!modelId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">参数错误</h2>
          <p className="text-gray-600 mb-4">未指定模型ID</p>
          <Button onClick={() => window.history.back()}>返回</Button>
        </div>
      </div>
    )
  }

  const model = await getModel(modelId)

  if (!model) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">模型不存在</h2>
          <p className="text-gray-600 mb-4">模型不存在或尚未完成生成</p>
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

      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        </div>
      }>
        <NewOrderForm model={model} />
      </Suspense>
    </div>
  )
}
