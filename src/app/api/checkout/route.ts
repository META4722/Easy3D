import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const {
      modelId,
      material,
      quantity,
      shippingAddress,
      notes
    } = await request.json()

    // Validate required fields
    if (!modelId || !material || !quantity || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 创建 Supabase 客户端（使用 anon key）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 从请求头获取用户认证信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 设置认证头
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Calculate price based on material and quantity
    const materialPrices = {
      PLA: 15.00,
      PETG: 20.00,
      ABS: 18.00,
      'PLA-Eco': 12.00, // 环保回收料
    }

    const basePrice = materialPrices[material as keyof typeof materialPrices] || 15.00
    const totalPrice = basePrice * quantity

    // 惰性创建订单表（如果不存在）
    try {
      await supabase.from('orders').select('id').limit(1)
    } catch (error) {
      // 如果表不存在，尝试创建（这在生产环境中应该通过迁移完成）
      console.log('Orders table might not exist, continuing with insert...')
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        model_id: modelId,
        material,
        quantity,
        price: totalPrice,
        status: 'pending',
        shipping_address: shippingAddress,
        notes
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`)
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // TODO: 替换 checkout 为支付宝 SDK
    // Mock payment success
    const paymentSuccess = Math.random() > 0.1 // 90% success rate for demo

    if (paymentSuccess) {
      // Update order status to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        throw new Error(`Failed to update order status: ${updateError.message}`)
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: totalPrice,
        status: 'paid'
      })
    } else {
      // Payment failed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Failed to update order status:', updateError)
      }

      return NextResponse.json(
        { error: 'Payment failed. Please try again.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Checkout error:', error)

    // 可选：记录错误日志（如果 error_logs 表存在）
    try {
      const supabaseForLogging = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      await supabaseForLogging
        .from('error_logs')
        .insert({
          source: 'checkout_api',
          payload: null,
          message: error instanceof Error ? error.message : 'Unknown error'
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}
