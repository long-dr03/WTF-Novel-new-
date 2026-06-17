"use client";

import React, { useEffect, useState } from "react";
import GooeyNav from "./GooeyNav/GooeyNav";

interface SectionHeaderProps {
  title: string;
  items: Array<{ label: string; href: string; [key: string]: any }>;
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function SectionHeader({
  title,
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3],
  activeIndex,
  onChange,
}: SectionHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h2 className="text-3xl font-bold">{title}</h2>
      <div className="w-full md:w-auto flex justify-start md:justify-end">
        {mounted ? (
          <GooeyNav
            items={items}
            animationTime={animationTime}
            particleCount={particleCount}
            particleDistances={particleDistances}
            particleR={particleR}
            timeVariance={timeVariance}
            colors={colors}
            initialActiveIndex={activeIndex}
            onChange={onChange}
          />
        ) : (
          // Simple fallback during server pre-rendering & hydration to prevent layout shift
          <div className="h-10 flex items-center gap-2 p-1.5 rounded-full bg-stone-100/50 dark:bg-zinc-900/30 border border-stone-200/40 dark:border-stone-800/40">
            {items.map((item, index) => (
              <span
                key={index}
                className={`px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  activeIndex === index
                    ? "bg-primary text-primary-foreground font-bold shadow-md"
                    : "text-stone-600 dark:text-stone-400"
                }`}
              >
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
