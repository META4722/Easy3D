import { NextRequest, NextResponse } from 'next/server'

// 取消任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    if (!process.env.TRIPO3D_API_KEY) {
      throw new Error('TRIPO3D_API_KEY is not configured')
    }

    // 检查是否是演示任务
    if (taskId.startsWith('demo_task_')) {
      return NextResponse.json({
        success: true,
        message: '演示任务已取消',
        demo: true
      })
    }

    const response = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tripo3D API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (data.code !== 0) {
      throw new Error(`Tripo3D API error: ${data.message || 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      message: '任务已取消'
    })

  } catch (error) {
    console.error('Cancel task error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel task' 
      },
      { status: 500 }
    )
  }
}

// 获取单个任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    if (!process.env.TRIPO3D_API_KEY) {
      throw new Error('TRIPO3D_API_KEY is not configured')
    }

    // 检查是否是演示任务
    if (taskId.startsWith('demo_task_')) {
      return NextResponse.json({
        success: true,
        data: {
          task_id: taskId,
          type: 'text_to_model',
          status: 'success',
          prompt: '演示任务',
          created_time: Date.now() - 3600000,
          progress: 100,
          model_url: 'https://example.com/model.glb'
        },
        demo: true
      })
    }

    const response = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tripo3D API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (data.code !== 0) {
      throw new Error(`Tripo3D API error: ${data.message || 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      data: data.data
    })

  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get task' 
      },
      { status: 500 }
    )
  }
}