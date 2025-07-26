import { NextRequest, NextResponse } from 'next/server'

// 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!process.env.TRIPO3D_API_KEY) {
      throw new Error('TRIPO3D_API_KEY is not configured')
    }

    const response = await fetch(`https://api.tripo3d.ai/v2/openapi/task/list?page=${page}&limit=${limit}`, {
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
    console.error('Get tasks error:', error)
    
    // 返回演示数据
    const demoTasks = Array.from({ length: 5 }, (_, i) => ({
      task_id: `demo_task_${Date.now()}_${i}`,
      type: i % 2 === 0 ? 'text_to_model' : 'image_to_model',
      status: ['queued', 'running', 'success', 'failed'][i % 4],
      prompt: i % 2 === 0 ? `演示任务 ${i + 1}` : null,
      created_time: Date.now() - (i * 3600000), // i 小时前
      progress: i % 4 === 1 ? Math.floor(Math.random() * 100) : 0,
      model_url: i % 4 === 2 ? 'https://example.com/model.glb' : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        tasks: demoTasks,
        total: demoTasks.length,
        page: 1,
        limit: 20
      },
      demo: true
    })
  }
}