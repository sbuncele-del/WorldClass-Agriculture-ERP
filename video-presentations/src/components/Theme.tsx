import React from 'react';

// Brand Colors
export const colors = {
  primary: '#0066FF',
  primaryDark: '#0052CC',
  primaryLight: '#4D94FF',
  secondary: '#00C853',
  secondaryDark: '#00A843',
  accent: '#FF6B35',
  
  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F8FAFC',
  lightGray: '#E5E7EB',
  mediumGray: '#9CA3AF',
  darkGray: '#4B5563',
  charcoal: '#1F2937',
  black: '#111827',
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Gradients
  primaryGradient: 'linear-gradient(135deg, #0066FF 0%, #00C853 100%)',
  darkGradient: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
  lightGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
};

// Typography
export const typography = {
  fontFamily: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace',
  },
  fontSize: {
    xs: 14,
    sm: 16,
    base: 18,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 56,
    '5xl': 72,
    '6xl': 96,
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  '2xl': 64,
  '3xl': 96,
  '4xl': 128,
};

// Common Styles
export const commonStyles = {
  // Headings
  h1: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    color: colors.charcoal,
  } as React.CSSProperties,
  
  h2: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    color: colors.charcoal,
  } as React.CSSProperties,
  
  h3: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
    color: colors.charcoal,
  } as React.CSSProperties,
  
  h4: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
    color: colors.charcoal,
  } as React.CSSProperties,
  
  // Body Text
  bodyLarge: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.darkGray,
  } as React.CSSProperties,
  
  body: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    color: colors.darkGray,
  } as React.CSSProperties,
  
  bodySmall: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    color: colors.mediumGray,
  } as React.CSSProperties,
  
  // Labels
  label: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: colors.primary,
  } as React.CSSProperties,
  
  // Stat Numbers
  statNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: 1,
    color: colors.charcoal,
  } as React.CSSProperties,
  
  statLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.darkGray,
  } as React.CSSProperties,
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style = {},
  shadow = 'md',
  padding = 'lg',
}) => {
  const shadows = {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: spacing[padding],
        boxShadow: shadows[shadow],
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  style = {},
}) => {
  const variants = {
    primary: { bg: colors.primaryLight + '20', color: colors.primaryDark },
    secondary: { bg: colors.secondary + '20', color: colors.secondaryDark },
    success: { bg: colors.success + '20', color: '#059669' },
    warning: { bg: colors.warning + '20', color: '#D97706' },
    error: { bg: colors.error + '20', color: '#DC2626' },
  };

  const { bg, color } = variants[variant];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 16px',
        backgroundColor: bg,
        color,
        borderRadius: 100,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        fontFamily: typography.fontFamily.body,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

// Icon Circle Component
interface IconCircleProps {
  icon: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const IconCircle: React.FC<IconCircleProps> = ({
  icon,
  size = 64,
  color = colors.primary,
  backgroundColor = colors.primaryLight + '20',
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        color,
      }}
    >
      {icon}
    </div>
  );
};

// Divider Component
interface DividerProps {
  style?: React.CSSProperties;
  color?: string;
}

export const Divider: React.FC<DividerProps> = ({
  style = {},
  color = colors.lightGray,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: 1,
        backgroundColor: color,
        ...style,
      }}
    />
  );
};
