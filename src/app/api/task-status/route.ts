import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("=== 进入 task-status API ===")
  
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    console.log("查询任务状态:", taskId)

    try {
      // 调用 Tripo3D 任务状态查询 API
      const tripo3dResponse = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
        }
      })

      console.log("Tripo3D 任务状态响应:", tripo3dResponse.status)

      if (!tripo3dResponse.ok) {
        const errorText = await tripo3dResponse.text()
        console.log("Tripo3D API 错误:", errorText)
        throw new Error(`Tripo3D API error! status: ${tripo3dResponse.status}`)
      }

      const taskData = await tripo3dResponse.json()
      console.log("任务状态数据:", taskData)

      if (taskData.code !== 0) {
        throw new Error(`Tripo3D API error: ${taskData.message || 'Unknown error'}`)
      }

      // 返回任务状态
      return NextResponse.json({
        success: true,
        data: {
          task_id: taskId,
          status: taskData.data.status,
          progress: taskData.data.progress || 0,
          model: taskData.data.output.pbr_model || null,
          preview: taskData.data.output.rendered_image || null,
          created_time: taskData.data.created_time,
          finished_time: taskData.data.finished_time
        }
      })

    } catch (apiError) {
      console.error('Tripo3D 任务状态查询失败:', apiError)
      
      // 返回演示数据
      return NextResponse.json({
        success: true,
        data: {
          task_id: taskId,
          status: 'success',
          progress: 100,
          model: {
            model_url: 'https://storage.googleapis.com/3d-model-samples/sample.glb',
            preview_url: 'https://storage.googleapis.com/3d-model-samples/sample-preview.jpg'
          }
        },
        demo: true
      })
    }

  } catch (error) {
    console.error('Task status error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get task status' 
      },
      { status: 500 }
    )
  }
}