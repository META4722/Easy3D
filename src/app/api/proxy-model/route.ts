import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("=== 进入 proxy-model API ===")
  
  try {
    const { searchParams } = new URL(request.url)
    const modelUrl = searchParams.get('url')

    if (!modelUrl) {
      return NextResponse.json(
        { error: 'Model URL is required' },
        { status: 400 }
      )
    }

    console.log("代理模型URL:", modelUrl)

    try {
      // 从原始URL获取模型文件
      const modelResponse = await fetch(modelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; 3D-Platform/1.0)',
        }
      })

      if (!modelResponse.ok) {
        throw new Error(`Failed to fetch model: ${modelResponse.statusText}`)
      }

      // 获取文件内容和类型
      const modelBuffer = await modelResponse.arrayBuffer()
      const contentType = modelResponse.headers.get('content-type') || 'application/octet-stream'
      
      console.log("模型文件大小:", modelBuffer.byteLength)
      console.log("内容类型:", contentType)

      // 返回文件，设置正确的CORS头
      return new NextResponse(modelBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600', // 缓存1小时
        }
      })

    } catch (fetchError) {
      console.error('获取模型文件失败:', fetchError)
      
      return NextResponse.json(
        { 
          success: false,
          error: '无法获取模型文件' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Proxy model error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to proxy model' 
      },
      { status: 500 }
    )
  }
}