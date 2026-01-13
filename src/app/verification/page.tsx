'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Navbar from '@/components/next/Navbar';
import Footer from '@/components/next/Footer';
import { 
  Shield, 
  Zap, 
  Crown, 
  TrendingUp, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Youtube, 
  Video, 
  Link as LinkIcon,
  Send,
  Loader2,
  ChevronRight,
  Clock,
  Megaphone
} from 'lucide-react';
import { applyVerification, getVerificationStatus, VerificationRequest } from '@/services/verification';

// 权益数据
const benefits = [
  {
    icon: Zap,
    title: '专属认证标识',
    desc: '头像旁显示尊贵"小闪电"认证图标，彰显独特身份',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  },
  {
    icon: Crown,
    title: '游戏内称号',
    desc: '获得服务器内全服可见的【主播认证】专属定制称号',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    icon: Megaphone,
    title: '专属进服提示',
    desc: '专属定制进服通报【Bilibili UP主】xxx 进入了服务器',
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  {
    icon: TrendingUp,
    title: '流量扶持',
    desc: '官网主页专属推荐位展示，为您的频道持续引流',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    icon: Gift,
    title: '更多权益',
    desc: '节日礼包、周边优先体验、活动优先参与权等福利',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10'
  }
];

const BilibiliIcon = ({ size = 24, className = "" }: { size?: number | string, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 1024 1024" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="currentColor"
  >
  <path d="M278.8864 148.1728c14.336-8.192 32.6144-9.3696 47.8208-2.6624 11.3664 4.6592 19.968 13.824 29.184 21.6064 38.144 32.9216 75.9808 66.304 114.2784 99.0208h80.4352c38.2976-32.768 76.0832-66.048 114.2272-98.9696 9.2672-7.7824 17.8688-16.896 29.2864-21.6576 14.7456-6.5024 32.4608-5.632 46.592 2.048 16.5888 8.5504 28.1088 26.2656 28.8256 44.9536 1.024 13.568-3.84 27.2896-12.3392 37.7856-7.5264 8.3456-16.5376 15.2064-24.8832 22.6816-5.3248 4.4032-10.1376 9.5232-16.0256 13.2096 23.6544 0 47.2576-0.256 70.912 0.1536 31.1296 0.8192 61.44 14.592 82.8928 37.1712 22.6304 22.2208 35.5328 53.5552 35.4816 85.1968 0.1024 108.4416 0 216.9344 0.0512 325.376-0.1024 16.384 0.8192 33.024-2.816 49.152-6.656 32.9728-28.8256 61.5936-56.9856 79.36a121.344 121.344 0 0 1-64.7168 17.7664H263.2704c-16.9984-0.1024-34.2528 0.8704-50.9952-2.8672-32.1024-6.4512-60.0064-27.648-77.824-54.6304a121.088 121.088 0 0 1-19.2512-66.9696v-321.536c0.1024-16.5376-0.9216-33.1776 2.4576-49.408 10.24-52.9408 58.9312-96.1024 112.9984-98.4576 24.6272-0.768 49.3056-0.2048 73.9328-0.3072-11.6224-8.3968-21.8112-18.5344-32.768-27.7504a55.04 55.04 0 0 1-20.5312-45.9264c0.7168-18.2272 11.6736-35.584 27.648-44.3392m-13.056 221.7984c-20.992 3.7376-38.912 20.3264-44.7488 40.7552a76.4928 76.4928 0 0 0-2.3552 21.7088c0.1024 89.0368-0.0512 178.0736 0.0512 267.1616-0.4096 24.2176 16.3328 47.1552 39.1168 54.8864 8.1408 2.9696 16.896 3.0208 25.3952 3.072 153.1904-0.1024 306.432 0.0512 459.6224-0.0512 22.4768 0.8704 44.0832-13.1072 53.5552-33.28 5.7856-11.5712 5.6832-24.7296 5.4784-37.376v-248.832c0-9.1136 0.3072-18.4832-2.304-27.2896a58.7776 58.7776 0 0 0-36.864-38.656c-9.7792-3.584-20.4288-3.0208-30.6688-3.072H292.5056c-8.8576 0-17.8176-0.3072-26.624 0.9728z" fill="#fe5588" p-id="10159"></path><path d="M358.7072 455.5264c14.6432-1.4848 29.8496 3.2768 41.0112 12.8 12.4416 10.24 19.5584 26.112 19.7632 42.1376 0.3584 19.4048 0.1024 38.8608 0.1024 58.2656 0 12.8-3.3792 25.8048-11.3152 35.9424a54.9888 54.9888 0 0 1-48.4864 21.76 54.9376 54.9376 0 0 1-44.032-28.2624c-6.8096-11.6736-7.3728-25.4976-7.168-38.6048 0.4096-18.8416-1.024-37.7856 0.8704-56.576a55.296 55.296 0 0 1 49.2544-47.4624z m292.4544 0a55.2448 55.2448 0 0 1 60.7232 53.0432c0.8192 18.2272 0.1024 36.4544 0.4096 54.6816 0.1024 12.8-1.4336 26.112-8.4992 37.12-10.24 17.0496-30.3104 27.5456-50.176 26.112a55.04 55.04 0 0 1-43.3664-24.9856c-7.936-11.776-9.472-26.2656-9.1136-40.0896 0.3584-18.7392-0.6656-37.4784 0.6144-56.1664 1.8432-25.6 23.9104-47.5136 49.408-49.664z" fill="#fe5588" p-id="10160"></path>
  </svg>
);

const douyinIcon = ({ size = 24, className = "" }: { size?: number | string, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 1024 1024" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="currentColor"
  >
    <path d="M810.667 256a128 128 0 0 1-128-128h-128v512a128 128 0 1 1-128-128h42.666V384h-42.666a256 256 0 1 0 256 256V349.44a256 256 0 0 0 128 34.56h42.666V256z" p-id="11522" data-spm-anchor-id="a313x.search_index.0.i17.7d813a81jWKnmN" fill="#2c2c2c"></path>
  </svg>
);

const kuaishou = ({ size = 24, className = "" }: { size?: number | string, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 1024 1024" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="currentColor"
  >
    <path d="M245.890861 709.744025h0.496c0 17.967999-0.432 35.935997 0.12 53.863995 0.68 20.919998 11.863999 27.927998 30.183997 18.719999a5175.471596 5175.471596 0 0 0 95.279993-49.167996c14.039999-7.407999 14.615999-41.183997 0.728-48.479996-31.647998-16.583999-63.439995-32.959997-95.567993-48.607997-19.631998-9.559999-30.559998-2.352-31.135997 19.783999-0.48 17.951999-0.104 35.919997-0.104 53.887996M691.226826 828.416015c3.736-0.52 7.471999-1.424 11.247999-1.52 49.847996-1.336 74.983994-26.935998 75.103994-76.703994 0.08-30.127998 0.456-60.271995-0.064-90.399993-0.712-43.007997-28.351998-70.175995-71.439994-70.335994-60.647995-0.24-121.287991-0.2-181.927986 0.056-45.343996 0.184-72.303994 27.135998-72.919994 73.015994-0.44 32.063997-0.44 64.127995 0.08 96.167993 0.632 38.511997 28.191998 66.383995 66.263995 67.879994 16.527999 0.64 33.055997 1.256 49.591996 1.88h-54.703996c0 1.2 0.024 2.4 0.04 3.592h206.599984c0.024-0.64 0.064-1.28 0.08-1.896l-27.951998-1.736m-77.231994 67.479995c-31.279998 0-62.551995 0.28-93.823993-0.064-57.359996-0.656-100.975992-24.735998-125.85599-77.839994-6.08-12.975999-11.959999-11.343999-21.895998-6.127999-31.631998 16.631999-63.535995 32.743997-95.431993 48.855996C226.746862 886.112011 177.346866 856.704013 176.650866 800.304017A8414.159343 8414.159343 0 0 1 176.426866 615.632032c0.52-54.927996 50.527996-84.799993 99.471992-60.015995 33.015997 16.711999 65.983995 33.519997 98.671993 50.887996 9.391999 4.992 13.679999 4.496 18.559998-6.192C417.386847 547.088037 459.946844 521.120039 517.56284 520.520039c64.455995-0.664 128.95199-0.72 193.423984 0C791.370818 521.416039 846.346814 577.040035 847.466814 657.696029c0.48 33.975997 0.896 67.975995 0.216 101.935992-1.568 80.063994-58.175995 135.743989-137.911989 136.239989-31.927998 0.2-63.839995 0.024-95.767993 0.024" p-id="7766"></path><path d="M692.754826 421.960047c44.775997-0.096 82.047994-36.583997 81.895993-80.175994-0.16-45.655996-36.583997-82.767994-81.599993-83.103993-44.407997-0.352-82.679994 37.367997-82.991994 81.839993-0.32 45.039996 36.759997 81.535994 82.695994 81.439994m-263.35198 0.08c60.871995-0.28 107.367992-46.959996 107.071992-107.519992-0.28-60.479995-47.287996-106.599992-108.479991-106.399991-60.095995 0.2-106.055992 47.471996-105.759992 108.783991 0.296 59.551995 47.031996 105.407992 107.167991 105.135992M442.666845 136.000069c48.535996 2.008 98.783992 26.479998 134.51199 76.983994 8.127999 11.479999 12.295999 10.767999 23.103998 3.304 54.663996-37.759997 113.079991-42.743997 170.479987-8.695999 58.319995 34.567997 85.199993 88.063993 75.223994 155.575988-9.599999 64.895995-48.735996 108.191992-111.687991 126.14399-59.199995 16.919999-112.343991 1.464-154.975988-43.231997-10.631999-11.119999-15.959999-10.215999-26.311998-0.496-72.159994 67.791995-178.471986 66.959995-249.631981-1.256-69.719995-66.847995-74.439994-176.527986-9.263999-248.39998C329.842854 156.520068 375.354851 135.968069 442.674845 136.000069" p-id="7767"></path><path d="M567.066836 831.064015c10.687999-1.152 21.383998-1.36 32.055997 0.144h64.767995c9.319999-1.616 18.655999-1.36 27.991998-0.192l28.143998 1.392c-0.04 0.512-0.056 1.024-0.096 1.52H512.06684c-0.024-0.944-0.024-1.904-0.04-2.864h55.039996z" p-id="7768"></path><path d="M664.026828 832.816015h-63.999995a314.543975 314.543975 0 0 1 63.999995 0" p-id="7769"></path>
  </svg>
);

const xiaohongshu = ({ size = 24, className = "" }: { size?: number | string, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 1024 1024" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="currentColor"
  >
    <path d="M1021.72444445 836.54883555V187.48757333C1021.72444445 85.61550222 938.38449778 2.27555555 836.51242667 2.27555555H187.48757333C85.61550222 2.27555555 2.27555555 85.61550222 2.27555555 187.48757333v649.06126222c0 100.85262222 81.70154667 183.57361778 182.2264889 185.1756089h654.9959111c100.48853333-1.60199111 182.22648889-84.28657778 182.2264889-185.1756089" fill="#FF2442" p-id="9142"></path><path d="M726.52117333 366.36444445h57.344v20.53461333c0 1.6384 0.80099555 2.40298667 2.36657778 2.36657777 34.00590222-1.01944889 68.26666667 0.07281778 85.81575111 34.95253334 10.44935111 20.68024889 8.30122667 52.13752889 7.71868445 76.82275556-0.03640889 1.45635555 0.65536 2.25735111 2.03889778 2.40298666 4.00497778 0.36408889 7.90072889 0.72817778 11.68725333 1.20149334 67.61130667 8.11918222 54.24924445 71.87114667 54.46769777 121.96977777 0.10922667 17.47626667-1.85685333 30.25578667-5.82542222 38.41137778-8.37404445 16.89372445-23.37450667 26.57848889-45.00138666 28.98147555H854.97173333l-21.55406222-50.02581333a1.6384 1.6384 0 0 1 0.10922667-1.52917333 1.56558222 1.56558222 0 0 1 1.31072-0.72817778l45.72956444-0.03640889c2.54862222 0 4.95160889-1.09226667 6.69923556-2.98552889a10.12167111 10.12167111 0 0 0 2.69425777-7.02691555c-0.21845333-15.29173333-0.32768-30.54705778-0.25486222-45.80238223 0-13.72615111-6.48078222-20.75306667-19.55157333-21.11715555-14.78200889-0.36408889-42.78044445-0.36408889-84.03171555 0.07281778-1.45635555 0-2.18453333 0.80099555-2.18453334 2.36657777l-0.21845333 126.81216H726.44835555l-0.18204444-127.35829333a2.25735111 2.25735111 0 0 0-2.22094222-2.33016889h-53.52106667a2.54862222 2.54862222 0 0 1-2.47580444-2.54862222l0.07281777-55.41432889c0-1.85685333 0.87381333-2.80348445 2.62144-2.80348444l52.90211556 0.10922667a2.51221333 2.51221333 0 0 0 1.82044444-0.80099556 2.76707555 2.76707555 0 0 0 0.72817778-1.89326222v-47.91409778a3.16757333 3.16757333 0 0 0-3.05834666-3.24039111l-32.65877334 0.14563555c-1.71121778 0-2.54862222-0.91022222-2.54862222-2.69425778l-0.10922666-55.7056c0-1.6384 0.72817778-2.43939555 2.36657777-2.43939555h33.82385778c1.45635555 0 2.18453333-0.72817778 2.18453333-2.29376l0.36408889-20.46179555z m59.38289778 137.37073777l35.57148444-0.07281777c0.58254222 0 1.12867555-0.25486222 1.52917334-0.6917689a2.29376 2.29376 0 0 0 0.61895111-1.6019911l-0.18204445-44.52807112c0-3.49525333-2.54862222-6.33514667-5.64337777-6.33514666l-28.54456889 0.07281778a5.35210667 5.35210667 0 0 0-4.00497778 1.89326222 6.80846222 6.80846222 0 0 0-1.6384 4.55111111l0.18204444 44.52807111c0 1.23790222 0.98304 2.18453333 2.11171556 2.18453333zM417.95584 507.74016c-13.83537778 0.25486222-38.84828445 4.11420445-44.30961778-13.68974222-3.31320889-10.63139555 4.18702222-25.44981333 8.73813333-35.82634667 12.96156445-29.52760889 25.66826667-59.16444445 38.15651556-88.91050666 0.50972445-1.20149333 1.38353778-1.82044445 2.62144-1.82044445h54.72256c0.47331555 0 0.87381333 0.25486222 1.09226667 0.65536a1.45635555 1.45635555 0 0 1 0.14563555 1.31072l-31.67573333 74.01927111c-0.72817778 1.71121778-0.54613333 3.64088889 0.40049778 5.24288a5.17006222 5.17006222 0 0 0 4.36906667 2.47580444h46.89464888c0.58254222 0 1.09226667 0.29127111 1.41994667 0.76458667 0.29127111 0.50972445 0.36408889 1.09226667 0.10922667 1.6384-13.54410667 31.56650667-27.05180445 62.91456-40.52309334 94.04416-1.34712889 3.09475555-1.92967111 5.38851555-1.71121778 6.84487111 0.47331555 3.16757333 2.25735111 4.76956445 5.31569778 4.80597334l29.67324445 0.18204444c1.71121778 0.03640889 2.25735111 0.87381333 1.56558222 2.54862222l-19.18748445 45.14702222a3.78652445 3.78652445 0 0 1-3.64088888 2.51221334c-30.14656 0.36408889-51.22730667 0.36408889-63.24224-0.18204444-19.87925333-0.91022222-24.75804445-18.31367111-17.03936-36.26325334l27.27025778-63.64273778a1.38353778 1.38353778 0 0 0-0.10922667-1.23790222 1.23790222 1.23790222 0 0 0-1.09226667-0.61895111zM190.58232889 694.00803555h-21.48124444l-21.04433778-49.40686222a1.60199111 1.60199111 0 0 1 0.10922666-1.49276444 1.45635555 1.45635555 0 0 1 1.23790222-0.72817778l29.70965334-0.07281778a6.95409778 6.95409778 0 0 0 6.80846222-7.09973333l0.80099556-262.03477333a2.54862222 2.54862222 0 0 1 2.51221333-2.62144h51.11808c2.40298667 0 3.60448 1.27431111 3.64088889 3.78652444 0.21845333 88.72846222 0.21845333 175.92775111 0 261.63427556-0.14563555 35.17098667-16.45681778 59.20085333-53.41184 58.03576888z" fill="#FFFFFF" p-id="9143"></path><path d="M670.08739555 694.00803555h-193.91374222l25.99594667-58.6183111a3.45884445 3.45884445 0 0 1 3.38602667-2.22094223l47.47719111 0.07281778c1.67480889 0 2.54862222-0.83740445 2.54862222-2.54862222v-177.85742223c0-1.52917333-0.72817778-2.29376-2.18453333-2.29376l-31.49368889-0.03640888c-1.41994667 0-2.54862222-1.23790222-2.54862223-2.73066667v-57.05272889c0-0.87381333 0.65536-1.60199111 1.49276445-1.60199111h128.37774222c1.60199111 0 2.36657778 0.83740445 2.36657778 2.51221333l0.07281778 56.43377778c0 1.6384-0.80099555 2.47580445-2.40298667 2.47580444h-31.74855111c-1.45635555 0-2.18453333 0.76458667-2.18453333 2.29376v177.74819556c0 1.71121778 0.83740445 2.54862222 2.43939555 2.54862222l50.31708445 0.10922667c1.38353778 0 2.07530667 0.72817778 2.07530666 2.18453333L670.08739555 694.04444445zM901.02897778 394.65415111c39.61287111-27.23384889 67.50208 42.19790222 24.10268444 54.10360889-7.06332445 1.96608-18.31367111 2.07530667-33.71463111 0.36408889-1.38353778-0.14563555-2.03889778-0.91022222-2.03889778-2.36657778-0.21845333-16.384-3.45884445-41.72458667 11.65084445-52.06471111zM354.20387555 598.79879111l-26.2144 61.05770667c-2.36657778 5.46133333-4.95160889 5.57056-7.8279111 0.43690667-19.29671111-34.87971555-25.85031111-63.35146667-29.63683556-106.71445334-2.91271111-33.67822222-5.42492445-67.35644445-7.60945778-101.10748444-0.07281778-1.52917333 0.61895111-2.29376 2.07530667-2.29376l53.12056889 0.03640888c1.49276445 0 2.33016889 0.80099555 2.43939555 2.3301689 2.73066667 39.24878222 5.60696889 78.38833778 8.59249778 117.41866666 0.76458667 10.04885333 2.47580445 18.38648889 5.09724445 25.01290667a4.73315555 4.73315555 0 0 1-0.0364089 3.82293333zM75.09333333 596.54144v-2.51221333a25.70467555 25.70467555 0 0 0 4.73315556-11.50520889c3.93216-43.32657778 7.13614222-86.61674667 9.64835556-129.94332445 0.10922667-1.34712889 0.76458667-2.03889778 2.03889777-2.03889778h54.24924445c0.47331555 0 0.94663111 0.21845333 1.31072 0.61895112 0.32768 0.36408889 0.50972445 0.87381333 0.47331555 1.38353778a7226.07217778 7226.07217778 0 0 1-9.57553777 119.67601777c-2.54862222 28.94506667-11.79648 67.68412445-31.1296 91.16785778-1.23790222 1.49276445-2.29376 1.34712889-3.09475556-0.47331555L75.09333333 596.54144zM445.08046222 694.00803555h-78.57038222l-10.01244445-3.96856888c-1.41994667-0.54613333-1.82044445-1.52917333-1.16508444-2.94912l24.64881778-56.43377778c0.72817778-1.6384 1.89326222-2.25735111 3.56807111-1.82044444 26.94257778 7.31818667 58.14499555 4.29624889 85.70652445 4.40547555 1.71121778 0.03640889 2.18453333 0.87381333 1.45635555 2.47580445l-25.63185778 58.25422222z" fill="#FFFFFF" p-id="9144"></path>
  </svg>
);

// 平台数据
const platforms = [
  { id: 'bilibili', name: 'Bilibili UP主', desc: '≥5000粉丝 或 单视频≥300点赞', icon: BilibiliIcon },
  { id: 'douyin', name: '抖音主播', desc: '≥1W粉丝 或 单视频≥3000点赞', icon: douyinIcon },
  { id: 'kuaishou', name: '快手主播', desc: '≥1W粉丝 或 单视频≥3000点赞', icon: kuaishou },
  { id: 'xiaohongshu', name: '小红书博主', desc: '≥5000粉丝 或 单视频≥200点赞', icon: xiaohongshu },
];

const GridBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    {/* Base Background */}
    <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#020617]" />
    
    {/* Grid Pattern */}
    <div 
      className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
      style={{
        backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
        backgroundSize: '32px 32px'
      }}
    />
    
    {/* Ambient Glows */}
    <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-500/20 blur-[100px] rounded-full opacity-60 dark:opacity-20" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 blur-[100px] rounded-full opacity-60 dark:opacity-20" />
    <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/20 blur-[100px] rounded-full opacity-60 dark:opacity-20" />
  </div>
);

const VerificationPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'guest' | 'pending' | 'can_apply'>('guest');
  const [pendingRequest, setPendingRequest] = useState<VerificationRequest | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (user) {
      checkStatus();
    } else {
      setVerificationStatus('guest');
      setCheckingStatus(false);
    }
  }, [user]);

  const checkStatus = async () => {
    try {
      const res = await getVerificationStatus();
      setVerificationStatus(res.status);
      if (res.request) {
        setPendingRequest(res.request);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const [formData, setFormData] = useState({
    platform: 'bilibili',
    homepage_link: '',
    homepage_name: '',
    proof_link: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('请先登录后再申请认证', 'error');
      router.push('/login');
      return;
    }

    if (!formData.homepage_link || !formData.homepage_name || !formData.proof_link) {
      showToast('请填写完整申请信息', 'error');
      return;
    }

    setLoading(true);
    try {
      await applyVerification(formData);
      showToast('申请提交成功！请耐心等待审核', 'success');
      checkStatus(); // Refresh status to show pending state
    } catch (error: any) {
      showToast(error.response?.data?.message || '提交失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GridBackground />
      
      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100/80 dark:bg-brand-900/30 backdrop-blur-sm text-brand-600 dark:text-brand-400 text-sm font-medium mb-6 border border-brand-200/50 dark:border-brand-700/50">
                  <Shield size={14} /> KukeMC 创作者计划
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                  点亮你的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-600">专属光芒</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                  加入 KukeMC 认证创作者行列，解锁独家特权与流量扶持。<br className="hidden md:block" />
                  让我们一起创造更精彩的游戏内容，连接每一位热爱 Minecraft 的玩家。
                </p>
              </motion.div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-20">
              {benefits.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group p-6 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300"
                >
                  <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Application Form Section */}
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Requirements & Guide */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="lg:col-span-1 space-y-6"
                >
                  <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircle2 className="text-green-500" size={20} />
                      申请要求
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-2 shrink-0" />
                        <span>满足对应平台的粉丝量要求，或单条 KukeMC 相关视频数据（播放/点赞）达标</span>
                      </li>
                      <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-2 shrink-0" />
                        <span>必须发布至少一条关于 KukeMC 服务器的视频或推荐动态</span>
                      </li>
                      <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-2 shrink-0" />
                        <span>内容需包含服务器IP <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono text-xs">mc.kuke.ink</code> 或官网链接</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-md rounded-2xl p-6 border border-blue-100/60 dark:border-blue-800/30">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                      <AlertCircle size={18} />
                      审核说明
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      我们将人工审核每一份申请，通常在 1-3 个工作日内完成。审核结果将官网通知或通过邮件发送给您。
                    </p>
                  </div>
                </motion.div>

                {/* Right: Form */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="lg:col-span-2"
                >
                  <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">填写申请资料</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">请确保信息真实有效，以便我们快速通过审核</p>
                  </div>
                  
                  {checkingStatus ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                  ) : verificationStatus === 'pending' && pendingRequest ? (
                    <div className="p-8 text-center py-16">
                      <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500">
                         <Clock size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        认证申请审核中
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                        您提交的 <strong>{platforms.find(p => p.id === pendingRequest.platform)?.name || pendingRequest.platform}</strong> 认证申请正在审核中，请耐心等待。<br/>
                        审核结果将通过邮件和站内信通知您。
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 max-w-sm mx-auto text-left text-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-500">申请时间</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(pendingRequest.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">主页链接</span>
                          <a href={pendingRequest.homepage_link} target="_blank" className="text-brand-500 hover:underline truncate max-w-[180px]">
                            {pendingRequest.homepage_name}
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    {/* Platform Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        选择入驻平台
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {platforms.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setFormData({ ...formData, platform: p.id })}
                            className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 ${
                              formData.platform === p.id
                                ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-900/20 backdrop-blur-sm'
                                : 'border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${formData.platform === p.id ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                <p.icon size={18} />
                              </div>
                              <div>
                                <div className={`font-semibold text-sm ${formData.platform === p.id ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {p.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
                              </div>
                            </div>
                            {formData.platform === p.id && (
                              <div className="absolute top-3 right-3 text-brand-500">
                                <CheckCircle2 size={16} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          平台主页链接
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.homepage_link}
                            onChange={(e) => setFormData({ ...formData, homepage_link: e.target.value })}
                            placeholder="https://..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                          />
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" size={18} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          平台昵称
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.homepage_name}
                            onChange={(e) => setFormData({ ...formData, homepage_name: e.target.value })}
                            placeholder="您的平台昵称"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-xs pointer-events-none">@</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        证明作品链接
                      </label>
                      <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.proof_link}
                            onChange={(e) => setFormData({ ...formData, proof_link: e.target.value })}
                            placeholder="请填写包含 KukeMC 内容的视频或动态链接"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                          />
                          <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        申请备注 (可选)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="想对管理员说的话..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            提交认证申请
                          </>
                        )}
                      </button>
                      <p className="text-center text-xs text-slate-400 mt-4">
                        提交即代表您同意遵守 KukeMC 社区创作者规范
                      </p>
                    </div>
                  </form>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default VerificationPage;
