import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';

interface FadeInTextProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}

export const FadeInText: React.FC<FadeInTextProps> = ({
  children,
  delay = 0,
  duration = 30,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const translateY = interpolate(
    frame,
    [delay, delay + duration],
    [30, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  style?: React.CSSProperties;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  delay = 0,
  duration = 30,
  direction = 'left',
  style = {},
}) => {
  const frame = useCurrentFrame();

  const getTranslateValues = () => {
    switch (direction) {
      case 'left':
        return { property: 'translateX', from: -100, to: 0 };
      case 'right':
        return { property: 'translateX', from: 100, to: 0 };
      case 'up':
        return { property: 'translateY', from: -100, to: 0 };
      case 'down':
        return { property: 'translateY', from: 100, to: 0 };
    }
  };

  const { property, from, to } = getTranslateValues();

  const opacity = interpolate(
    frame,
    [delay, delay + duration * 0.5],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const translate = interpolate(
    frame,
    [delay, delay + duration],
    [from, to],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  return (
    <div
      style={{
        opacity,
        transform: `${property}(${translate}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  duration = 30,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [delay, delay + duration * 0.5],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const scale = interpolate(
    frame,
    [delay, delay + duration],
    [0.8, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    }
  );

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface TypewriterProps {
  text: string;
  delay?: number;
  speed?: number;
  style?: React.CSSProperties;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  delay = 0,
  speed = 2,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const charactersToShow = Math.floor(
    interpolate(
      frame,
      [delay, delay + text.length * speed],
      [0, text.length],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    )
  );

  const opacity = interpolate(
    frame,
    [delay, delay + 5],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <span style={{ opacity, ...style }}>
      {text.slice(0, charactersToShow)}
      {charactersToShow < text.length && (
        <span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
      )}
    </span>
  );
};

interface CountUpProps {
  start?: number;
  end: number;
  delay?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}

export const CountUp: React.FC<CountUpProps> = ({
  start = 0,
  end,
  delay = 0,
  duration = 60,
  prefix = '',
  suffix = '',
  style = {},
}) => {
  const frame = useCurrentFrame();

  const value = interpolate(
    frame,
    [delay, delay + duration],
    [start, end],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const opacity = interpolate(
    frame,
    [delay, delay + 10],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <span style={{ opacity, ...style }}>
      {prefix}{Math.round(value).toLocaleString()}{suffix}
    </span>
  );
};

interface ProgressBarProps {
  progress: number;
  delay?: number;
  duration?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  delay = 0,
  duration = 45,
  color = '#0066FF',
  backgroundColor = '#E5E7EB',
  height = 8,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const currentProgress = interpolate(
    frame,
    [delay, delay + duration],
    [0, progress],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  return (
    <div
      style={{
        width: '100%',
        height,
        backgroundColor,
        borderRadius: height / 2,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${currentProgress}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </div>
  );
};
