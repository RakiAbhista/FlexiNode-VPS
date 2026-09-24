"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationFrom?: { opacity?: number; transform?: string };
  animationTo?: { opacity?: number; transform?: string };
  easing?: any;
  threshold?: number;
  rootMargin?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  onLetterAnimationComplete?: () => void;
}

export function SplitText({
  text,
  className = "",
  delay = 50,
  animationFrom = { opacity: 0, transform: "translate3d(0,30px,0)" },
  animationTo = { opacity: 1, transform: "translate3d(0,0,0)" },
  easing = "easeOut",
  threshold = 0.1,
  rootMargin = "-50px",
  textAlign = "center",
  onLetterAnimationComplete,
}: SplitTextProps) {
  const words = text.split(" ");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <h1
      ref={ref}
      className={`inline-block overflow-hidden ${className}`}
      style={{ textAlign }}
    >
      {words.map((word, wordIndex) => (
        <span
          key={wordIndex}
          className="inline-block whitespace-nowrap mr-[0.25em] last:mr-0"
        >
          <motion.span
            className="inline-block"
            initial={animationFrom}
            animate={inView ? animationTo : animationFrom}
            transition={{
              duration: 0.5,
              ease: easing,
              delay: (wordIndex * delay) / 1000,
            }}
            onAnimationComplete={
              wordIndex === words.length - 1 ? onLetterAnimationComplete : undefined
            }
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
