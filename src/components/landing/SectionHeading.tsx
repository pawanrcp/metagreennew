import React from 'react';
import { cn } from '@/src/lib/utils';
import { Reveal } from './Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: 'left' | 'center';
  dark?: boolean;
  className?: string;
  id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  align = 'center',
  dark = false,
  className,
  id,
}: SectionHeadingProps) {
  return (
    <Reveal
      variant="up"
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'mb-3 inline-block rounded-full border px-3.5 py-1 text-xs font-semibold uppercase tracking-widest',
            dark
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={cn(
          'text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl',
          dark ? 'text-white' : 'text-slate-900'
        )}
      >
        {title}{' '}
        {highlight && (
          <span className={dark ? 'text-gradient-dark' : 'text-gradient'}>
            {highlight}
          </span>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed sm:text-lg',
            dark ? 'text-slate-400' : 'text-slate-600'
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
