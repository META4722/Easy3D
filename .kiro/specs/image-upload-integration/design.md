# 图片上传集成设计文档

## 概述

设计一个完整的图片上传系统，集成Tripo3D API，为3D模型生成提供图片输入支持。

## 架构

### 前端组件架构
```
GeneratePage
├── ImageUploadZone (新组件)
│   ├── DropZone (react-dropzone)
│   ├── ImagePreview
│   ├── UploadProgress
│   └── ErrorDisplay
└── ModelViewer
```

### API架构
```
/api/upload-image (新端点)
├── 文件验证
├── Tripo3D API调用
├── 错误处理
└── 响应标准化
```

## 组件和接口

### 1. ImageUploadZone 组件

```typescript
interface ImageUploadZoneProps {
  onImageUploaded: (imageToken: string, previewUrl: string) => void
  onError: (error: string) => void
  disabled?: boolean
}

interface UploadState {
  isUploading: boolean
  progress: number
  imageToken: string | null
  previewUrl: string | null
  error: string | null
}
```

### 2. API端点设计

**端点：** `POST /api/upload-image`

**请求格式：**
```typescript
// FormData with file
const formData = new FormData()
formData.append('file', imageFile)
```

**响应格式：**
```typescript
// 成功响应
{
  success: true,
  data: {
    image_token: string,
    preview_url: string
  }
}

// 错误响应
{
  success: false,
  error: string,
  code: number
}
```

### 3. Tripo3D API集成

**API调用流程：**
1. 接收前端上传的文件
2. 验证文件格式和大小
3. 构造multipart/form-data请求
4. 调用Tripo3D上传API
5. 处理响应并标准化返回

## 数据模型

### 文件验证规则
- 支持格式：PNG, JPG, JPEG, WebP
- 最大文件大小：10MB
- 最小分辨率：256x256
- 最大分辨率：2048x2048

### 错误处理策略
- 网络错误：重试机制（最多3次）
- 文件格式错误：立即返回错误
- API限制错误：显示限制信息
- 服务器错误：记录日志并返回通用错误

## 测试策略

### 单元测试
- ImageUploadZone组件测试
- API端点测试
- 文件验证逻辑测试

### 集成测试
- 完整上传流程测试
- 错误场景测试
- Tripo3D API集成测试

### 用户测试
- 拖拽上传体验测试
- 错误处理用户体验测试
- 不同文件格式兼容性测试