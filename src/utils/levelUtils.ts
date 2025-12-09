
interface LevelStyle {
  text: string;
  bg: string;
  border: string;
  gradient: string;
  shadow: string;
  icon: string;
}

export const getLevelColor = (level: number): LevelStyle => {
  if (level <= 10) {
    // Novice (0-10): Slate/Gray - The Beginning
    return {
      text: "text-slate-600 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800",
      border: "border-slate-200 dark:border-slate-700",
      gradient: "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700",
      shadow: "shadow-slate-500/20",
      icon: "text-slate-500"
    };
  } else if (level <= 20) {
    // Apprentice (11-20): Emerald - Growth
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      gradient: "from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40",
      shadow: "shadow-emerald-500/20",
      icon: "text-emerald-500"
    };
  } else if (level <= 30) {
    // Adept (21-30): Sky/Blue - The Sky
    return {
      text: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-900/20",
      border: "border-sky-200 dark:border-sky-800",
      gradient: "from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40",
      shadow: "shadow-sky-500/20",
      icon: "text-sky-500"
    };
  } else if (level <= 40) {
    // Expert (31-40): Indigo/Violet - Mystery
    return {
      text: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      border: "border-indigo-200 dark:border-indigo-800",
      gradient: "from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40",
      shadow: "shadow-indigo-500/20",
      icon: "text-indigo-500"
    };
  } else if (level <= 50) {
    // Master (41-50): Purple/Fuchsia - Royalty
    return {
      text: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-800",
      gradient: "from-purple-100 to-fuchsia-100 dark:from-purple-900/40 dark:to-fuchsia-900/40",
      shadow: "shadow-purple-500/20",
      icon: "text-purple-500"
    };
  } else if (level <= 60) {
    // Grandmaster (51-60): Pink/Rose - Passion
    return {
      text: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-50 dark:bg-pink-900/20",
      border: "border-pink-200 dark:border-pink-800",
      gradient: "from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40",
      shadow: "shadow-pink-500/20",
      icon: "text-pink-500"
    };
  } else if (level <= 70) {
    // Legend (61-70): Orange/Amber - Fire
    return {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800",
      gradient: "from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40",
      shadow: "shadow-orange-500/20",
      icon: "text-orange-500"
    };
  } else if (level <= 80) {
    // Mythic (71-80): Red/Crimson - Blood
    return {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      gradient: "from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40",
      shadow: "shadow-red-500/20",
      icon: "text-red-500"
    };
  } else if (level <= 90) {
    // Divine (81-90): Yellow/Gold - Divinity
    return {
      text: "text-yellow-700 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      gradient: "from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40",
      shadow: "shadow-yellow-500/20",
      icon: "text-yellow-500"
    };
  } else {
    // Infinite (91+): Rainbow/Iridescent - The Ultimate
    return {
      text: "text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-bold",
      bg: "bg-slate-50 dark:bg-slate-900",
      border: "border-indigo-200 dark:border-indigo-800",
      gradient: "from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40",
      shadow: "shadow-purple-500/30",
      icon: "text-purple-500"
    };
  }
};
