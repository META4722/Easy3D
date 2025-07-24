'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

interface ModelViewerProps {
  modelUrl?: string
  className?: string
  onModelLoad?: () => void
}

export default function ModelViewer({
  modelUrl,
  className = '',
  onModelLoad
}: ModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const controlsRef = useRef<OrbitControls>()
  const modelRef = useRef<THREE.Object3D>()
  const gridRef = useRef<THREE.GridHelper>()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showGrid, setShowGrid] = useState(true)

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(5, 5, 5)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = false
    controls.minDistance = 1
    controls.maxDistance = 50
    controls.maxPolarAngle = Math.PI / 2
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Grid
    const grid = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc)
    scene.add(grid)
    gridRef.current = grid

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mount) return
      const newWidth = mount.clientWidth
      const newHeight = mount.clientHeight

      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  // Load model
  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return

    setLoading(true)
    setError(undefined)

    const loader = new GLTFLoader()

    loader.load(
      modelUrl,
      (gltf) => {
        if (!sceneRef.current) return

        // Remove previous model
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current)
        }

        const model = gltf.scene

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim

        model.scale.setScalar(scale)
        model.position.sub(center.multiplyScalar(scale))

        // Enable shadows
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        sceneRef.current.add(model)
        modelRef.current = model

        setLoading(false)
        onModelLoad?.()
      },
      (progress) => {
        // Loading progress
        console.log('Loading progress:', progress)
      },
      (error) => {
        console.error('Error loading model:', error)
        setError('Failed to load 3D model')
        setLoading(false)
      }
    )
  }, [modelUrl, onModelLoad])

  const toggleGrid = () => {
    if (gridRef.current) {
      gridRef.current.visible = !showGrid
      setShowGrid(!showGrid)
    }
  }

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(5, 5, 5)
      controlsRef.current.reset()
    }
  }

  const zoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(0.8)
    }
  }

  const zoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.multiplyScalar(1.2)
    }
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div ref={mountRef} className="w-full h-full min-h-[400px]" />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleGrid}
          title={showGrid ? '隐藏网格' : '显示网格'}
        >
          {showGrid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={resetCamera}
          title="重置视角"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={zoomIn}
          title="放大"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={zoomOut}
          title="缩小"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载3D模型中...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <Button variant="outline" onClick={() => setError(undefined)}>
              重试
            </Button>
          </div>
        </div>
      )}

      {/* Tips */}
      {!loading && !error && (
        <div className="absolute bottom-4 left-4 text-sm text-gray-600 bg-white/80 px-2 py-1 rounded">
          拖拽旋转 • 滚轮缩放 • 右键平移
        </div>
      )}
    </Card>
  )
}
