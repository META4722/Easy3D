import { NextRequest, NextResponse } from 'next/server'

// 批量操作任务
export async function POST(request: NextRequest) {
  try {
    const { action, taskIds } = await request.json()

    if (!action || !taskIds || !Array.isArray(taskIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    if (!process.env.TRIPO3D_API_KEY) {
      throw new Error('TRIPO3D_API_KEY is not configured')
    }

    const results = []
    const errors = []

    // 处理批量取消操作
    if (action === 'cancel') {
      for (const taskId of taskIds) {
        try {
          // 检查是否是演示任务
          if (taskId.startsWith('demo_task_')) {
            results.push({
              taskId,
              success: true,
              message: '演示任务已取消'
            })
            continue
          }

          const response = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
            }
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API error: ${response.status} - ${errorText}`)
          }

          const data = await response.json()

          if (data.code !== 0) {
            throw new Error(`API error: ${data.message || 'Unknown error'}`)
          }

          results.push({
            taskId,
            success: true,
            message: '任务已取消'
          })

        } catch (error) {
          errors.push({
            taskId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported action' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: taskIds.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('Batch operation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Batch operation failed' 
      },
      { status: 500 }
    )
  }
}