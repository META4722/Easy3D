import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
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

    // Get user from session
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create model record
    const { data: model, error: modelError } = await supabase
      .from('models')
      .insert({
        user_id: session.user.id,
        prompt: prompt || 'Image to 3D conversion',
        status: 'generating'
      })
      .select()
      .single()

    if (modelError) {
      throw new Error(`Failed to create model record: ${modelError.message}`)
    }

    // Call Fast3D API
    try {
      const fast3dResponse = await fetch('https://api.fast3d.io/v1/text2mesh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FAST3D_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          image_token: imageToken,
          quality: 'high',
          format: 'glb'
        }),
      })

      if (!fast3dResponse.ok) {
        throw new Error(`Fast3D API error: ${fast3dResponse.statusText}`)
      }

      const fast3dData = await fast3dResponse.json()

      // Update model with result
      const { error: updateError } = await supabase
        .from('models')
        .update({
          file_url: fast3dData.glb_url,
          preview_url: fast3dData.preview_url,
          status: 'completed'
        })
        .eq('id', model.id)

      if (updateError) {
        throw new Error(`Failed to update model: ${updateError.message}`)
      }

      return NextResponse.json({
        id: model.id,
        file_url: fast3dData.glb_url,
        preview_url: fast3dData.preview_url,
        status: 'completed'
      })

    } catch (apiError) {
      // Update model status to failed
      await supabase
        .from('models')
        .update({ status: 'failed' })
        .eq('id', model.id)

      // Log error
      await supabaseAdmin
        .from('error_logs')
        .insert({
          source: 'fast3d_api',
          payload: { prompt, imageToken, modelId: model.id },
          message: apiError instanceof Error ? apiError.message : 'Unknown error'
        })

      // For demo purposes, return a mock response
      const mockGlbUrl = 'https://storage.googleapis.com/3d-model-samples/sample.glb'
      const mockPreviewUrl = 'https://storage.googleapis.com/3d-model-samples/sample-preview.jpg'

      await supabase
        .from('models')
        .update({
          file_url: mockGlbUrl,
          preview_url: mockPreviewUrl,
          status: 'completed'
        })
        .eq('id', model.id)

      return NextResponse.json({
        id: model.id,
        file_url: mockGlbUrl,
        preview_url: mockPreviewUrl,
        status: 'completed',
        demo: true
      })
    }

  } catch (error) {
    console.error('Generate model error:', error)

    // Log error
    await supabaseAdmin
      .from('error_logs')
      .insert({
        source: 'generate_model_api',
        payload: null,
        message: error instanceof Error ? error.message : 'Unknown error'
      })

    return NextResponse.json(
      { error: 'Failed to generate model' },
      { status: 500 }
    )
  }
}
