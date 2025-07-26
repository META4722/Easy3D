import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageToken, imageType } = await request.json()

    if (!prompt && !imageToken) {
      return NextResponse.json(
        { error: 'Prompt or image token is required' },
        { status: 400 }
      )
    }

    console.log("=== 接收到的请求参数 ===")
    console.log("prompt:", prompt)
    console.log("imageToken:", imageToken)
    console.log("imageType:", imageType)

    // 检查是否是演示 token
    if (imageToken && imageToken.startsWith('demo_token_')) {
      console.log("⚠️ 检测到演示 token，跳过真实 API 调用")
      return NextResponse.json({
        success: true,
        data: {
          task_id: `demo_task_${Date.now()}`,
          status: 'processing'
        },
        demo: true,
        message: '演示模式 - 使用演示图片 token'
      })
    }

    try {
      // 构建请求数据 - 根据是否有 imageToken 决定类型
      const requestData = imageToken ? {
        // 图片转模型 - 根据 Tripo3D API 文档格式
        type: 'image_to_model',
        file: {
          type: imageType , // 使用实际的图片类型
          file_token: imageToken
        }
      } : {
        // 文本转模型
        type: 'text_to_model',
        prompt: prompt
      }

      console.log("=== 发送给 Tripo3D 的请求数据 ===")
      console.log(JSON.stringify(requestData, null, 2))

      // 验证 API Key
      if (!process.env.TRIPO3D_API_KEY) {
        throw new Error('TRIPO3D_API_KEY is not configured')
      }

      const tripo3dResponse = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`
        },
        body: JSON.stringify(requestData)
      })

      console.log("=== Tripo3D API 响应状态 ===")
      console.log("状态码:", tripo3dResponse.status)
      console.log("状态文本:", tripo3dResponse.statusText)

      if (!tripo3dResponse.ok) {
        const errorText = await tripo3dResponse.text()
        console.error("=== Tripo3D API 错误响应 ===")
        console.error("错误内容:", errorText)
        throw new Error(`Tripo3D API error! status: ${tripo3dResponse.status}, response: ${errorText}`)
      }

      const tripo3dData = await tripo3dResponse.json()
      console.log("=== Tripo3D API 成功响应 ===")
      console.log(JSON.stringify(tripo3dData, null, 2))

      // 检查 Tripo3D API 响应
      if (tripo3dData.code !== 0) {
        console.error("=== Tripo3D API 业务错误 ===")
        console.error("错误代码:", tripo3dData.code)
        console.error("错误消息:", tripo3dData.message)
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