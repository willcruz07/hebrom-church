import { useEffect, useState } from 'react';

const easeOutExpo = (t: number, b: number, c: number, d: number): number => {
  return t === d ? b + c : c * (-Math.pow(2, (-10 * t) / d) + 1) + b;
};

interface UseCountUpProps {
  end: number;
  start?: number;
  duration?: number; // em ms
  delay?: number; // em ms
}

export const useCountUp = ({ end, start = 0, duration = 2000, delay = 0 }: UseCountUpProps) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;
    let timeoutId: NodeJS.Timeout;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;

      if (timeElapsed < duration) {
        const nextCount = easeOutExpo(timeElapsed, start, end - start, duration);
        setCount(nextCount);
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        animationFrameId = requestAnimationFrame(animate);
      }, delay);
    } else {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [end, start, duration, delay]);

  return count;
};
