import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Get user from session
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
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

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
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

    // Log error
    await supabaseAdmin
      .from('error_logs')
      .insert({
        source: 'checkout_api',
        payload: null,
        message: error instanceof Error ? error.message : 'Unknown error'
      })

    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}
