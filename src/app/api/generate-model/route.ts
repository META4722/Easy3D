import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageToken } = await request.json()

    if (!prompt && !imageToken) {
      return NextResponse.json(
        { error: 'Prompt or image token is required' },
        { status: 400 }
      )
    }

    // 临时跳过数据库操作，直接测试 Tripo3D API
    console.log("准备调用 Tripo3D API...")

    try {
      // 构建请求数据 - 根据是否有 imageToken 决定类型
      const requestData = imageToken ? {
        // 图片转模型
        type: 'image_to_model',
        file: {
          type: 'jpg',
          file_token: imageToken
        }
      } : {
        // 文本转模型
        type: 'text_to_model',
        prompt: prompt
      }

      console.log("请求数据:", requestData)

      const tripo3dResponse = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
        },
        body: JSON.stringify(requestData)
      })

      console.log("Tripo3D API 响应状态:", tripo3dResponse.status)
      console.log("Tripo3D API 响应头:", Object.fromEntries(tripo3dResponse.headers.entries()))

      if (!tripo3dResponse.ok) {
        const errorText = await tripo3dResponse.text()
        console.log("Tripo3D API 错误响应:", errorText)
        throw new Error(`Tripo3D API error! status: ${tripo3dResponse.status}, response: ${errorText}`)
      }

      const tripo3dData = await tripo3dResponse.json()
      console.log("Tripo3D API 响应数据:", tripo3dData)

      // 检查 Tripo3D API 响应
      if (tripo3dData.code !== 0) {
        throw new Error(`Tripo3D API error: ${tripo3dData.message || 'Unknown error'}`)
      }

      // 返回成功响应
      return NextResponse.json({
        success: true,
        data: tripo3dData.data,
        message: '任务已提交到 Tripo3D'
      })

    } catch (apiError) {
      console.error('Tripo3D API 调用失败:', apiError)
      
      // 返回演示响应
      return NextResponse.json({
        success: true,
        data: {
          task_id: `demo_task_${Date.now()}`,
          status: 'processing'
        },
        demo: true,
        message: '演示模式 - Tripo3D API 调用失败，返回模拟数据'
      })
    }

  } catch (error) {
    console.error('Generate model error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate model' 
      },
      { status: 500 }
    )
  }
}