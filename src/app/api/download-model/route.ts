import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("=== 进入 download-model API ===")
  
  try {
    const { searchParams } = new URL(request.url)
    const modelUrl = searchParams.get('url')
    const filename = searchParams.get('filename') || 'model.glb'

    if (!modelUrl) {
      return NextResponse.json(
        { error: 'Model URL is required' },
        { status: 400 }
      )
    }

    console.log("下载模型:", modelUrl)

    try {
      // 从 Tripo3D 下载模型文件
      const modelResponse = await fetch(modelUrl)

      if (!modelResponse.ok) {
        throw new Error(`Failed to download model: ${modelResponse.statusText}`)
      }

      // 获取文件内容
      const modelBuffer = await modelResponse.arrayBuffer()
      
      // 返回文件流供浏览器下载
      return new NextResponse(modelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': modelBuffer.byteLength.toString()
        }
      })

    } catch (downloadError) {
      console.error('模型下载失败:', downloadError)
      
      return NextResponse.json(
        { 
          success: false,
          error: '模型下载失败' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Download model error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download model' 
      },
      { status: 500 }
    )
  }
}