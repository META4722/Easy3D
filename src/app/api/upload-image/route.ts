import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log("=== 进入 upload-image API ===")
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log("接收到文件:", {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '只支持图片文件' },
        { status: 400 }
      )
    }

    // 检查文件大小 (限制为 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 10MB' },
        { status: 400 }
      )
    }

    try {
      // 准备上传到 Tripo3D
      const tripo3dFormData = new FormData()
      tripo3dFormData.append('file', file)

      console.log("准备上传到 Tripo3D API")

      const tripo3dResponse = await fetch('https://api.tripo3d.ai/v2/openapi/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`,
        },
        body: tripo3dFormData
      })

      console.log("Tripo3D 上传响应状态:", tripo3dResponse.status)

      if (!tripo3dResponse.ok) {
        const errorText = await tripo3dResponse.text()
        console.log("Tripo3D 上传错误:", errorText)
        throw new Error(`Tripo3D upload failed: ${tripo3dResponse.status}`)
      }

      const uploadResult = await tripo3dResponse.json()
      console.log("Tripo3D 上传结果:", uploadResult)

      if (uploadResult.code !== 0) {
        throw new Error(`Tripo3D API error: ${uploadResult.message || 'Unknown error'}`)
      }

      // 根据文件类型确定图片类型
      let imageType = 'jpg' // 默认类型
      if (file.type === 'image/png') {
        imageType = 'png'
      } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        imageType = 'jpg'
      } else if (file.type === 'image/webp') {
        imageType = 'webp'
      }

      // 返回成功结果
      return NextResponse.json({
        success: true,
        data: {
          image_token: uploadResult.data.image_token,
          image_type: imageType
        }
      })

    } catch (uploadError) {
      console.error('Tripo3D 上传失败:', uploadError)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `上传到 Tripo3D 失败: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}` 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload image' 
      },
      { status: 500 }
    )
  }
}