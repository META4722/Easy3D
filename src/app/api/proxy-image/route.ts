import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("=== 进入 proxy-image API ===")
  
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    console.log("代理图片URL:", imageUrl)

    try {
      // 从原始URL获取图片文件
      const imageResponse = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; 3D-Platform/1.0)',
        }
      })

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
      }

      // 获取图片内容和类型
      const imageBuffer = await imageResponse.arrayBuffer()
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
      
      console.log("图片文件大小:", imageBuffer.byteLength)
      console.log("内容类型:", contentType)

      // 返回图片，设置正确的CORS头
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=7200', // 缓存2小时
        }
      })

    } catch (fetchError) {
      console.error('获取图片文件失败:', fetchError)
      
      return NextResponse.json(
        { 
          success: false,
          error: '无法获取图片文件' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Proxy image error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to proxy image' 
      },
      { status: 500 }
    )
  }
}