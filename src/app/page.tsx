import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Sparkles,
  Printer,
  Leaf,
  ArrowRight,
  Clock,
  Shield,
  Award
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Printer className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">3D打印平台</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/generate" className="text-gray-600 hover:text-gray-900">
              AI生成
            </Link>
            <Link href="/models" className="text-gray-600 hover:text-gray-900">
              我的模型
            </Link>
            <Link href="/orders" className="text-gray-600 hover:text-gray-900">
              订单
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/generate">
              <Button>立即体验</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="h-4 w-4 mr-1" />
            AI定制3D打印
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            从想法到实物
            <br />
            仅需10秒
          </h1>

          <div className="space-y-2 mb-8 text-lg text-gray-600">
            <p>10秒生成高精度3D模型</p>
            <p>无需登录即可免费体验</p>
            <p>支持文本描述和图片输入</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/generate">
              <Button size="lg" className="text-lg px-8 py-6">
                免费开始生成
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              观看演示
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>极速生成</CardTitle>
                <CardDescription>
                  AI算法驱动，8-10秒内完成从文本到3D模型的转换
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>环保材料</CardTitle>
                <CardDescription>
                  使用PLA回收料打印，碳排放减少30%，支持可持续发展
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>高精度输出</CardTitle>
                <CardDescription>
                  PBR材质渲染，支持多种格式下载，打印质量媲美专业级
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">简单三步，轻松上手</h2>
            <p className="text-gray-600 text-lg">无需3D建模经验，人人都能创造</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">描述或上传</h3>
              <p className="text-gray-600">输入文字描述或上传参考图片</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI生成模型</h3>
              <p className="text-gray-600">10秒内AI自动生成高质量3D模型</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">即时打印</h3>
              <p className="text-gray-600">一键下单，专业打印机队列自动制作</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">适用场景</h2>
            <p className="text-gray-600 text-lg">专注垂直场景，打造专业体验</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>桌搭配件</CardTitle>
                <CardDescription>
                  个性化桌面装饰、手机支架、键盘腕托等实用配件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-4"></div>
                <p className="text-sm text-gray-600">平均价格：¥15-35</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>潮玩收藏</CardTitle>
                <CardDescription>
                  限量手办、艺术雕塑、游戏角色等收藏级作品
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mb-4"></div>
                <p className="text-sm text-gray-600">平均价格：¥25-80</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>文创产品</CardTitle>
                <CardDescription>
                  纪念品、礼品定制、品牌周边等创意产品
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-4"></div>
                <p className="text-sm text-gray-600">平均价格：¥20-60</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">准备好创造了吗？</h2>
          <p className="text-xl mb-8 opacity-90">
            加入数千名创作者，开始你的3D打印之旅
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/generate">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                <Clock className="mr-2 h-5 w-5" />
                立即免费体验
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-purple-600">
                <Shield className="mr-2 h-5 w-5" />
                注册账号
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Printer className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">3D打印平台</span>
              </div>
              <p className="text-gray-400">
                让每个人都能轻松创造属于自己的3D世界
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">产品</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/generate" className="hover:text-white">AI生成</Link></li>
                <li><Link href="/models" className="hover:text-white">模型库</Link></li>
                <li><Link href="/orders" className="hover:text-white">打印服务</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">支持</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">帮助中心</a></li>
                <li><a href="#" className="hover:text-white">联系我们</a></li>
                <li><a href="#" className="hover:text-white">反馈建议</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">公司</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">关于我们</a></li>
                <li><a href="#" className="hover:text-white">隐私政策</a></li>
                <li><a href="#" className="hover:text-white">服务条款</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 3D打印平台. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
