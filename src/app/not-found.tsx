// app/not-found.tsx
'use client'

import { motion } from 'framer-motion'
import { Home, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 动画图标 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
              <AlertCircle className="w-16 h-16 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border-4 border-red-200 rounded-full"
            />
          </div>
        </motion.div>

        {/* 错误代码 */}
        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-9xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4"
        >
          丸辣
        </motion.h1>

        {/* 错误信息 */}
        <motion.h2
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4"
        >
          页面未找到
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed"
        >
          抱歉，您访问的页面不存在或已被末影人移动。
          请检查URL是否正确，或返回首页继续浏览。
        </motion.p>

        {/* 操作按钮 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              返回首页
            </motion.button>
          </Link>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上页
          </motion.button>
        </motion.div>

        {/* 额外帮助信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg"
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            需要帮助？交个{' '}
            <Link href="/tickets" className="text-brand-600 hover:text-brand-500 underline">
              工单
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}