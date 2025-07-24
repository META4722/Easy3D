import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get user from session and check admin role
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        models (
          file_url,
          prompt,
          parameters
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: 'Order must be paid before printing' },
        { status: 400 }
      )
    }

    try {
      // TODO: 接 Banbu 打印机 WebSocket 反馈→更新 orders.status
      // Mock Banbu printer integration
      const printJob = {
        orderId: order.id,
        modelUrl: order.models?.file_url,
        material: order.material,
        quantity: order.quantity,
        parameters: order.models?.parameters || {},
        timestamp: new Date().toISOString()
      }

      // Simulate sending to printer queue
      console.log('Sending to Banbu printer:', printJob)

      // Update order status to printing
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'printing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) {
        throw new Error(`Failed to update order status: ${updateError.message}`)
      }

      // Simulate printer response after delay
      setTimeout(async () => {
        try {
          // Mock print completion after 30 seconds (in real scenario, this would come from Banbu WebSocket)
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'shipped',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
        } catch (error) {
          console.error('Failed to update order to shipped:', error)
        }
      }, 30000)

      return NextResponse.json({
        success: true,
        message: 'Order sent to printer successfully',
        orderId: order.id,
        status: 'printing'
      })

    } catch (printerError) {
      // Log specific printer error
      await supabaseAdmin
        .from('error_logs')
        .insert({
          source: 'banbu_printer',
          payload: { orderId, error: printerError },
          message: printerError instanceof Error ? printerError.message : 'Printer communication failed'
        })

      return NextResponse.json(
        { error: 'Failed to send to printer' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Send to print error:', error)

    // Log error
    await supabaseAdmin
      .from('error_logs')
      .insert({
        source: 'send_to_print_api',
        payload: { orderId: request.json() },
        message: error instanceof Error ? error.message : 'Unknown error'
      })

    return NextResponse.json(
      { error: 'Failed to process print request' },
      { status: 500 }
    )
  }
}
