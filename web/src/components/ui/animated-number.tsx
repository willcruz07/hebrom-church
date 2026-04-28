'use client';

import { useCountUp } from '@/hooks/use-count-up';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
  duration?: number;
}

export const AnimatedNumber = ({
  value,
  prefix = '',
  suffix = '',
  className,
  decimals = 0,
  duration = 2.5,
}: AnimatedNumberProps) => {
  const count = useCountUp({
    end: value,
    duration: duration * 1000,
  });

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(count);

  return (
    <span className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
};
