import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

type RevealVariant = 'up' | 'fade' | 'left' | 'right' | 'scale';

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
  key?: React.Key;
}

const HIDDEN: Record<RevealVariant, string> = {
  up: 'opacity-0 translate-y-8',
  fade: 'opacity-0',
  left: 'opacity-0 -translate-x-8',
  right: 'opacity-0 translate-x-8',
  scale: 'opacity-0 scale-95',
};

const SHOWN = 'opacity-100 translate-x-0 translate-y-0 scale-100';

export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className,
  once = true,
  threshold = 0.15,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-out will-change-transform',
        visible ? SHOWN : HIDDEN[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
