import React from 'react';

const minecraftColorClasses: Record<string, string> = {
  '0': 'text-black dark:text-black',
  '1': 'text-[#0000AA] dark:text-[#5555FF]',
  '2': 'text-[#00AA00] dark:text-[#55FF55]',
  '3': 'text-[#00AAAA] dark:text-[#55FFFF]',
  '4': 'text-[#AA0000] dark:text-[#FF5555]',
  '5': 'text-[#AA00AA] dark:text-[#FF55FF]',
  '6': 'text-[#D97706] dark:text-[#FFAA00]', // Gold
  '7': 'text-[#4B5563] dark:text-[#AAAAAA]', // Gray
  '8': 'text-[#555555] dark:text-[#555555]', // Dark Gray
  '9': 'text-[#2563EB] dark:text-[#5555FF]',
  'a': 'text-[#16A34A] dark:text-[#55FF55]',
  'b': 'text-[#0891B2] dark:text-[#55FFFF]',
  'c': 'text-[#DC2626] dark:text-[#FF5555]',
  'd': 'text-[#C026D3] dark:text-[#FF55FF]',
  'e': 'text-[#CA8A04] dark:text-[#FFFF55]', // Yellow
  'f': 'text-[#1F2937] dark:text-white',     // White
};

export const MinecraftText = ({ text, className }: { text: string; className?: string }) => {
  if (!text) return null;
  if (!text.includes('§')) return <span className={className}>{text}</span>;

  const segments: { text: string; color: string | null; bold: boolean; italic: boolean; underline: boolean; strike: boolean; obfuscated: boolean }[] = [];
  
  let currentColor: string | null = null;
  let bold = false;
  let italic = false;
  let underline = false;
  let strike = false;
  let obfuscated = false;

  const parts = text.split(/(§[0-9a-fk-or])/g);

  parts.forEach((part) => {
    if (part.startsWith('§')) {
      const code = part[1].toLowerCase();
      if (/[0-9a-f]/.test(code)) {
        currentColor = code;
        bold = false;
        italic = false;
        underline = false;
        strike = false;
        obfuscated = false;
      } else {
        switch (code) {
          case 'l': bold = true; break;
          case 'o': italic = true; break;
          case 'n': underline = true; break;
          case 'm': strike = true; break;
          case 'k': obfuscated = true; break;
          case 'r':
            currentColor = null;
            bold = false;
            italic = false;
            underline = false;
            strike = false;
            obfuscated = false;
            break;
        }
      }
    } else if (part.length > 0) {
      segments.push({
        text: part,
        color: currentColor,
        bold,
        italic,
        underline,
        strike,
        obfuscated
      });
    }
  });

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        const classes = [
          seg.color ? (minecraftColorClasses[seg.color] || '') : 'text-inherit',
          seg.bold ? 'font-black' : '',
          seg.italic ? 'italic' : '',
          seg.underline ? 'underline' : '',
          seg.strike ? 'line-through' : '',
        ].filter(Boolean).join(' ');

        return (
          <span key={i} className={classes}>
            {seg.text}
          </span>
        );
      })}
    </span>
  );
};
