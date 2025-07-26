"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ModelViewer from "@/components/ModelViewer";
import {
  Upload,
  Sparkles,
  Loader2,
  Settings,
  Download,
  ShoppingCart,
  Leaf,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { log } from "console";

interface GeneratedModel {
  id: string;
  file_url: string;
  preview_url?: string;
  status: string;
  demo?: boolean;
  task_id?: string;
  progress?: number;
}

interface ModelParameters {
  scale: number;
  detail: number;
  density: number;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageToken, setImageToken] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModel, setGeneratedModel] = useState<GeneratedModel | null>(
    null,
  );
  const [error, setError] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [taskStatus, setTaskStatus] = useState<string>("");
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const [pollCleanup, setPollCleanup] = useState<(() => void) | null>(null);
  const [parameters, setParameters] = useState<ModelParameters>({
    scale: 1.0,
    detail: 0.5,
    density: 0.7,
  });

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      if (pollCleanup) {
        pollCleanup();
      }
    };
  }, [pollCleanup]);

  const uploadImageToTripo3D = async (file: File) => {
    console.log("=== 开始上传图片到 Tripo3D ===");
    console.log("文件信息:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("准备调用 /api/upload-image");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      console.log("API 响应状态:", response.status);

      if (!response.ok) {
        throw new Error(`上传失败: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("上传结果:", result);

      if (!result.success) {
        throw new Error(result.error || "上传失败");
      }

      // 设置图片token和预览
      setImageToken(result.data.image_token);
      console.log("✅ 图片上传成功，获得 token:", result.data.image_token);

      setUploadedImage(file);

      // 创建本地预览
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("上传失败:", err);
      setError(err instanceof Error ? err.message : "上传失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadImageToTripo3D(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
  });

  // 轮询任务状态 - 优化版本
  const pollTaskStatus = async (taskId: string) => {
    console.log("开始轮询任务状态:", taskId);

    // 轮询配置
    const POLL_CONFIG = {
      maxAttempts: 199, // 最大轮询次数 (120次 * 3秒 = 6分钟)
      pollInterval: 3000, // 轮询间隔 (3秒)
      errorRetryInterval: 5000, // 错误重试间隔 (5秒)
      maxErrorRetries: 5, // 最大错误重试次数
      stuckTimeout: 180000, // 卡住超时时间 (3分钟)
    };

    let pollCount = 0;
    let errorCount = 0;
    let lastStatus = "";
    let lastStatusTime = Date.now();
    let pollTimeoutId: NodeJS.Timeout | null = null;

    const poll = async () => {
      pollCount++;
      console.log(`轮询第 ${pollCount} 次，任务ID: ${taskId}`);

      // 检查是否超过最大轮询次数
      if (pollCount > POLL_CONFIG.maxAttempts) {
        console.log("轮询次数超限，停止轮询");
        setIsGenerating(false);
        setError("任务处理超时，请重试或联系客服");
        return;
      }

      try {
        const response = await fetch(`/api/task-status?taskId=${taskId}`);

        if (!response.ok) {
          throw new Error("获取任务状态失败");
        }

        const result = await response.json();
        console.log(`任务状态 (第${pollCount}次):`, result);

        if (result.success) {
          const { status, progress, model, preview } = result.data;
          const currentTime = Date.now();

          console.log("=== 轮询状态详情 ===");
          console.log("状态:", status);
          console.log("进度:", progress);
          console.log("模型数据:", model);
          console.log("预览数据:", preview);
          console.log("完整数据:", JSON.stringify(result.data, null, 2));

          // 检查状态是否发生变化
          if (status !== lastStatus) {
            lastStatus = status;
            lastStatusTime = currentTime;
            console.log(`🔄 状态变化: ${lastStatus} → ${status}`);
          } else {
            // 检查是否在同一状态卡太久
            const stuckTime = currentTime - lastStatusTime;
            console.log(
              `⏱️ 在 ${status} 状态已停留 ${Math.round(stuckTime / 1000)} 秒`,
            );

            if (stuckTime > POLL_CONFIG.stuckTimeout) {
              console.log(
                `⚠️ 任务在 ${status} 状态卡住超过 ${POLL_CONFIG.stuckTimeout / 1000} 秒`,
              );
              setIsGenerating(false);
              setError(`任务处理异常：在 ${status} 状态停留过久，请重试`);
              return;
            }
          }

          setTaskStatus(status);
          setTaskProgress(progress || 0);

          // 根据状态更新UI
          switch (status) {
            case "queued":
              console.log(
                `📋 任务排队中... (${pollCount}/${POLL_CONFIG.maxAttempts})`,
              );
              break;
            case "running":
              console.log(
                `🔄 任务进行中... ${progress}% (${pollCount}/${POLL_CONFIG.maxAttempts})`,
              );
              break;
            case "success":
              console.log("🎉 任务完成!");
              console.log("完整模型数据:", model);
              console.log("模型URL:", model);
              console.log("预览URL:", preview);

              setIsGenerating(false);
              // 使用代理URL来避免跨域问题
              const proxyModelUrl = model
                ? `/api/proxy-model?url=${encodeURIComponent(model)}`
                : "";
              const proxyPreviewUrl = preview
                ? `/api/proxy-image?url=${encodeURIComponent(preview)}`
                : "";

              console.log("代理模型URL:", proxyModelUrl);
              console.log("代理预览URL:", proxyPreviewUrl);

              setGeneratedModel({
                id: taskId,
                file_url: proxyModelUrl,
                preview_url: proxyPreviewUrl,
                status: "completed",
                task_id: taskId,
                progress: 100,
                demo: result.demo,
              });

              if (pollTimeoutId) clearTimeout(pollTimeoutId);
              console.log("✅ 轮询完成，模型已设置");
              return; // 停止轮询

            case "failed":
            case "cancelled":
              console.log(`❌ 任务${status === "failed" ? "失败" : "被取消"}`);
              setIsGenerating(false);
              setError(`任务${status === "failed" ? "失败" : "被取消"}`);
              if (pollTimeoutId) clearTimeout(pollTimeoutId);
              return; // 停止轮询

            default:
              console.log(`❓ 未知状态: ${status}`);
              break;
          }

          // 重置错误计数
          errorCount = 0;

          // 如果任务还在进行中，继续轮询
          if (status === "queued" || status === "running") {
            console.log(`⏰ ${POLL_CONFIG.pollInterval / 1000}秒后继续轮询...`);
            pollTimeoutId = setTimeout(poll, POLL_CONFIG.pollInterval);
          } else {
            console.log(`🛑 任务状态为 ${status}，停止轮询`);
          }
        } else {
          console.log("❌ API返回失败:", result);
          throw new Error(result.error || "获取任务状态失败");
        }
      } catch (err) {
        errorCount++;
        console.error(
          `🚨 轮询任务状态失败 (第${errorCount}/${POLL_CONFIG.maxErrorRetries}次错误):`,
          err,
        );

        // 检查是否超过最大错误重试次数
        if (errorCount > POLL_CONFIG.maxErrorRetries) {
          console.log("💥 错误重试次数超限，停止轮询");
          setIsGenerating(false);
          setError("网络连接异常，请检查网络后重试");
          return;
        }

        // 错误重试
        console.log(
          `🔄 ${POLL_CONFIG.errorRetryInterval / 1000}秒后重试... (剩余重试次数: ${POLL_CONFIG.maxErrorRetries - errorCount})`,
        );
        pollTimeoutId = setTimeout(poll, POLL_CONFIG.errorRetryInterval);
      }
    };

    // 开始轮询
    poll();

    // 返回清理函数，用于取消轮询
    return () => {
      if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
        console.log("轮询已取消");
      }
    };
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageToken) {
      setError("请输入描述文本或上传图片");
      return;
    }

    // 如果有正在进行的轮询，先清理
    if (pollCleanup) {
      pollCleanup();
      setPollCleanup(null);
    }

    setIsGenerating(true);
    setError("");
    setGeneratedModel(null);
    setTaskId("");
    setTaskStatus("");
    setTaskProgress(0);

    try {
      const response = await fetch("/api/generate-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageToken: imageToken || null,
          parameters,
        }),
      });

      if (!response.ok) {
        throw new Error("生成失败，请重试");
      }

      const result = await response.json();
      console.log("=== 生成API响应 ===");
      console.log("完整结果:", JSON.stringify(result, null, 2));
      console.log("result.success:", result.success);
      console.log("result.data:", result.data);
      console.log("task_id:", result.data?.task_id);

      if (result.success && result.data?.task_id) {
        const newTaskId = result.data.task_id;
        console.log("✅ 获得任务ID，开始轮询:", newTaskId);

        setTaskId(newTaskId);
        setTaskStatus("queued");

        // 开始轮询任务状态，并保存清理函数
        const cleanup = pollTaskStatus(newTaskId);
        setPollCleanup(() => cleanup);
      } else if (result.demo) {
        // 如果是演示模式，直接设置结果
        console.log("🎭 演示模式，直接设置模型结果");
        setGeneratedModel({
          id: result.data?.task_id || "demo",
          file_url:
            "https://storage.googleapis.com/3d-model-samples/sample.glb",
          preview_url:
            "https://storage.googleapis.com/3d-model-samples/sample-preview.jpg",
          status: "completed",
          demo: true,
        });
        setIsGenerating(false);
      } else {
        console.log("❌ 未知的响应格式:", result);
        throw new Error("服务器返回了未知的响应格式");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
      setIsGenerating(false);
    }
  };

  const handleParameterChange = (
    param: keyof ModelParameters,
    value: number,
  ) => {
    setParameters((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  const handleCancelGeneration = () => {
    if (pollCleanup) {
      pollCleanup();
      setPollCleanup(null);
    }
    setIsGenerating(false);
    setTaskStatus("");
    setTaskProgress(0);
    setError("生成已取消");
    console.log("用户取消了模型生成");
  };

  const handleDownloadModel = async () => {
    if (!generatedModel?.file_url) return;

    try {
      const filename = `model_${generatedModel.id}.glb`;

      // 如果是代理URL，需要提取原始URL
      let downloadUrl = generatedModel.file_url;
      if (downloadUrl.startsWith("/api/proxy-model?url=")) {
        // 从代理URL中提取原始URL
        const urlParam = downloadUrl.split("url=")[1];
        const originalUrl = decodeURIComponent(urlParam);
        downloadUrl = `/api/download-model?url=${encodeURIComponent(originalUrl)}&filename=${filename}`;
      } else {
        downloadUrl = `/api/download-model?url=${encodeURIComponent(downloadUrl)}&filename=${filename}`;
      }

      // 创建下载链接
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("开始下载模型:", filename);
    } catch (err) {
      console.error("下载失败:", err);
      setError("模型下载失败，请重试");
    }
  };

  const handleOrderPrint = () => {
    if (!generatedModel) return;
    // Navigate to order page with model ID
    window.location.href = `/orders/new?modelId=${generatedModel.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">AI生成器</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/models">
              <Button variant="ghost">我的模型</Button>
            </Link>
            <Link href="/orders">
              <Button variant="ghost">订单</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  描述你的想法
                </CardTitle>
                <CardDescription>
                  用文字描述或上传图片，AI将为你生成专业的3D模型
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">文字描述</Label>
                  <Textarea
                    id="prompt"
                    placeholder="例如：一个可爱的小猫咪手机支架，有着大眼睛和微笑表情..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="text-center text-gray-500">或者</div>

                <div>
                  <Label>上传参考图片</Label>
                  <div
                    {...getRootProps()}
                    className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : isUploading
                          ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                          : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input {...getInputProps()} disabled={isUploading} />
                    {isUploading ? (
                      <div className="space-y-3">
                        <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
                        <p className="text-gray-600">上传中...</p>
                      </div>
                    ) : imagePreview ? (
                      <div className="space-y-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded"
                        />
                        <p className="text-sm text-gray-600">
                          点击或拖拽更换图片
                        </p>
                        {imageToken && (
                          <p className="text-xs text-green-600">
                            ✓ 图片已上传成功
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-gray-600">
                            {isDragActive ? "释放文件" : "点击或拖拽图片到此处"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            支持 PNG, JPG, JPEG, WebP 格式
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!prompt.trim() && !imageToken)}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        开始生成 (约30-60秒)
                      </>
                    )}
                  </Button>

                  {/* 取消按钮 - 只在生成中显示 */}
                  {isGenerating && (
                    <Button
                      onClick={handleCancelGeneration}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      取消生成
                    </Button>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* 调试信息面板 - 开发模式下显示 */}
                {process.env.NODE_ENV === "development" &&
                  (taskId || taskStatus) && (
                    <div className="bg-gray-100 p-3 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-gray-700">
                        调试信息:
                      </div>
                      {taskId && <div>任务ID: {taskId}</div>}
                      {taskStatus && <div>状态: {taskStatus}</div>}
                      {taskProgress > 0 && <div>进度: {taskProgress}%</div>}
                      <div>生成中: {isGenerating ? "是" : "否"}</div>
                      <div>图片Token: {imageToken ? "已设置" : "未设置"}</div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Leaf className="h-5 w-5" />
                  环保提示
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-sm">
                  选择 PLA 回收料材质可减少 30% 碳排放，为环保贡献一份力量！
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>3D预览</CardTitle>
                  <CardDescription>
                    {generatedModel
                      ? "拖拽旋转查看模型"
                      : "生成完成后将在此显示3D模型"}
                  </CardDescription>
                </div>

                {generatedModel && (
                  <div className="flex gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          参数调整
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>模型参数</SheetTitle>
                          <SheetDescription>
                            调整参数后点击重新生成来应用更改
                          </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6 mt-6">
                          <div>
                            <Label>缩放比例: {parameters.scale}x</Label>
                            <Slider
                              value={[parameters.scale]}
                              onValueChange={([value]) =>
                                handleParameterChange("scale", value)
                              }
                              min={0.5}
                              max={2.0}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>
                              细节级别: {Math.round(parameters.detail * 100)}%
                            </Label>
                            <Slider
                              value={[parameters.detail]}
                              onValueChange={([value]) =>
                                handleParameterChange("detail", value)
                              }
                              min={0.1}
                              max={1.0}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>
                              网格密度: {Math.round(parameters.density * 100)}%
                            </Label>
                            <Slider
                              value={[parameters.density]}
                              onValueChange={([value]) =>
                                handleParameterChange("density", value)
                              }
                              min={0.3}
                              max={1.0}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-0">
                {generatedModel ? (
                  <div className="relative">
                    <ModelViewer
                      modelUrl={generatedModel.file_url}
                      className="h-96"
                    />
                    {generatedModel.demo && (
                      <Badge
                        variant="secondary"
                        className="absolute top-4 left-4 bg-yellow-100 text-yellow-800"
                      >
                        演示模式
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="h-96 bg-gray-100 flex items-center justify-center text-gray-500">
                    {isGenerating ? (
                      <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                        <p>AI正在生成你的3D模型...</p>
                        {taskStatus && (
                          <div className="space-y-2">
                            <p className="text-sm">
                              状态:{" "}
                              {taskStatus === "queued"
                                ? "排队中"
                                : taskStatus === "running"
                                  ? "生成中"
                                  : taskStatus === "success"
                                    ? "完成"
                                    : taskStatus === "failed"
                                      ? "失败"
                                      : taskStatus === "cancelled"
                                        ? "已取消"
                                        : taskStatus}
                            </p>
                            {taskProgress > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${taskProgress}%` }}
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              {taskProgress > 0
                                ? `${taskProgress}%`
                                : "请耐心等待..."}
                            </p>
                          </div>
                        )}
                        {!taskStatus && (
                          <p className="text-sm">这通常需要30-60秒</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>等待生成3D模型</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {generatedModel && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleDownloadModel}
                  disabled={!generatedModel.file_url}
                >
                  <Download className="h-4 w-4" />
                  下载模型
                </Button>

                <Button
                  onClick={handleOrderPrint}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  下单打印
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
