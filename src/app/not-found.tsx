// app/not-found.tsx
'use client'

import { motion } from 'framer-motion'
import { Home, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// 定义动画变体 - 使用Variants统一管理动画状态[7](@ref)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // 子元素错开动画[8](@ref)
      duration: 0.8
    }
  }
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      duration: 0.8
    }
  }
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export default function NotFound() {
  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-md w-full text-center">
        {/* 动画图标 */}
        <motion.div
          variants={iconVariants}
          className="mb-8"
        >
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
              <AlertCircle className="w-16 h-16 text-white" />
            </div>
            <motion.div
              variants={pulseVariants}
              animate="pulse"
              className="absolute inset-0 border-4 border-red-200/50 rounded-full"
            />
          </div>
        </motion.div>

        {/* 错误代码 */}
        <motion.h1
          variants={itemVariants}
          className="text-9xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4"
        >
          404
        </motion.h1>

        {/* 错误信息 */}
        <motion.h2
          variants={itemVariants}
          className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4 font-sans"
        >
          页面未找到
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-base font-sans"
        >
          很抱歉，您要查找的页面暂时无法访问。
          它可能已被移动、删除或网址输入有误。
        </motion.p>

        {/* 操作按钮 */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/" className="block">
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium shadow-lg w-full sm:w-auto transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              返回首页
            </motion.button>
          </Link>
          
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium shadow-lg w-full sm:w-auto transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上页
          </motion.button>
        </motion.div>

        {/* 额外帮助信息 */}
        <motion.div
          variants={itemVariants}
          className="mt-12 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg backdrop-blur-sm"
        >
          <p className="text-sm text-slate-600 dark:text-slate-300 font-sans">
            需要帮助？交个{' '}
            <Link href="/tickets" className="text-blue-600 hover:text-blue-500 underline font-medium">
              工单
            </Link>
            ，我们将尽快为您解决
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}