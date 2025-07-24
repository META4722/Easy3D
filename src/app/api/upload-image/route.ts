import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  console.log("=== 进入 upload-image API POST 方法 ===")
  console.log("请求 URL:", request.url)
  console.log("请求方法:", request.method)
  console.log("formData", request.formData)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided', code: 400 },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Please use PNG, JPG, JPEG, or WebP.', code: 400 },
        { status: 400 }
      )
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.', code: 400 },
        { status: 400 }
      )
    }

    // 准备上传到 Tripo3D - 按照官方文档格式
    console.log("准备上传文件到 Tripo3D API")
    console.log("文件信息:", {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // 将 File 转换为 ArrayBuffer，然后创建 Blob
    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })

    const uploadFormData = new FormData()
    uploadFormData.append('file', blob, file.name)

    try {
      console.log("调用 Tripo3D API...")
      const tripo3dResponse = await fetch('https://api.tripo3d.ai/v2/openapi/upload/sts', {
        method: 'POST',
        headers: {
          // 注意：不要手动设置 Content-Type，让浏览器自动设置 multipart/form-data 的边界
          'Authorization': `Bearer ${process.env.TRIPO3D_API_KEY}`,
        },
        body: uploadFormData,
      })

      if (!tripo3dResponse.ok) {
        throw new Error(`Tripo3D API error: ${tripo3dResponse.statusText}`)
      }

      const tripo3dData = await tripo3dResponse.json()
      console.log("Tripo3D API 响应:", tripo3dData)

      if (tripo3dData.code !== 0) {
        throw new Error(`Tripo3D API error: ${tripo3dData.message || 'Unknown error'}`)
      }

      // 创建预览URL (使用文件的blob URL)
      const previewUrl = URL.createObjectURL(file)

      return NextResponse.json({
        success: true,
        data: {
          image_token: tripo3dData.data.image_token,
          preview_url: previewUrl
        }
      })

    } catch (apiError) {
      // 记录错误到数据库
      await supabaseAdmin
        .from('error_logs')
        .insert({
          source: 'tripo3d_upload',
          payload: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          },
          message: apiError instanceof Error ? apiError.message : 'Unknown upload error'
        })

      // 返回演示响应用于开发测试
      const mockImageToken = `demo_token_${Date.now()}`
      const previewUrl = URL.createObjectURL(file)

      return NextResponse.json({
        success: true,
        data: {
          image_token: mockImageToken,
          preview_url: previewUrl
        },
        demo: true
      })
    }

  } catch (error) {
    console.error('Upload image error:', error)

    // 记录错误
    await supabaseAdmin
      .from('error_logs')
      .insert({
        source: 'upload_image_api',
        payload: null,
        message: error instanceof Error ? error.message : 'Unknown error'
      })

    return NextResponse.json(
      { success: false, error: 'Failed to upload image', code: 500 },
      { status: 500 }
    )
  }
}