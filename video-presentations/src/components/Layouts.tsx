import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors, typography, spacing } from './Theme';

// Base Layout for all slides
interface SlideLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
  padding?: number;
}

export const SlideLayout: React.FC<SlideLayoutProps> = ({
  children,
  backgroundColor = colors.white,
  padding = spacing['3xl'],
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        padding,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Header with Logo
interface HeaderProps {
  showLogo?: boolean;
  showBrand?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showLogo = true,
  showBrand = true,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
      }}
    >
      {showLogo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: colors.primaryGradient,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.white,
              fontSize: 24,
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.heading,
            }}
          >
            S
          </div>
          {showBrand && (
            <span
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.heading,
                color: colors.charcoal,
              }}
            >
              SiyaBusa
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Footer
interface FooterProps {
  slideNumber?: number;
  totalSlides?: number;
  subtitle?: string;
}

export const Footer: React.FC<FooterProps> = ({
  slideNumber,
  totalSlides,
  subtitle,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: spacing.xl,
        left: spacing['3xl'],
        right: spacing['3xl'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {subtitle && (
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.mediumGray,
            fontFamily: typography.fontFamily.body,
          }}
        >
          {subtitle}
        </span>
      )}
      {slideNumber && totalSlides && (
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.mediumGray,
            fontFamily: typography.fontFamily.body,
          }}
        >
          {slideNumber} / {totalSlides}
        </span>
      )}
    </div>
  );
};

// Two Column Layout
interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  ratio?: '50-50' | '60-40' | '40-60' | '70-30' | '30-70';
  gap?: number;
  style?: React.CSSProperties;
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  left,
  right,
  ratio = '50-50',
  gap = spacing.xl,
  style = {},
}) => {
  const ratios: Record<string, [string, string]> = {
    '50-50': ['1', '1'],
    '60-40': ['1.5', '1'],
    '40-60': ['1', '1.5'],
    '70-30': ['2.33', '1'],
    '30-70': ['1', '2.33'],
  };

  const [leftFlex, rightFlex] = ratios[ratio];

  return (
    <div
      style={{
        display: 'flex',
        gap,
        flex: 1,
        ...style,
      }}
    >
      <div style={{ flex: leftFlex, display: 'flex', flexDirection: 'column' }}>
        {left}
      </div>
      <div style={{ flex: rightFlex, display: 'flex', flexDirection: 'column' }}>
        {right}
      </div>
    </div>
  );
};

// Grid Layout
interface GridLayoutProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: React.CSSProperties;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = 3,
  gap = spacing.lg,
  style = {},
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Centered Content
interface CenteredContentProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const CenteredContent: React.FC<CenteredContentProps> = ({
  children,
  style = {},
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Section Title
interface SectionTitleProps {
  label?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  label,
  title,
  subtitle,
  centered = false,
}) => {
  return (
    <div
      style={{
        marginBottom: spacing.xl,
        textAlign: centered ? 'center' : 'left',
      }}
    >
      {label && (
        <div
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.primary,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: spacing.sm,
            fontFamily: typography.fontFamily.body,
          }}
        >
          {label}
        </div>
      )}
      <h2
        style={{
          fontSize: typography.fontSize['4xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.charcoal,
          lineHeight: typography.lineHeight.tight,
          marginBottom: subtitle ? spacing.sm : 0,
          fontFamily: typography.fontFamily.heading,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.darkGray,
            lineHeight: typography.lineHeight.relaxed,
            maxWidth: centered ? 800 : 'none',
            margin: centered ? '0 auto' : 0,
            fontFamily: typography.fontFamily.body,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

// Stat Box
interface StatBoxProps {
  value: string;
  label: string;
  sublabel?: string;
  style?: React.CSSProperties;
}

export const StatBox: React.FC<StatBoxProps> = ({
  value,
  label,
  sublabel,
  style = {},
}) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: spacing.lg,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: typography.fontSize['5xl'],
          fontWeight: typography.fontWeight.extrabold,
          color: colors.primary,
          lineHeight: 1,
          marginBottom: spacing.sm,
          fontFamily: typography.fontFamily.heading,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.charcoal,
          fontFamily: typography.fontFamily.body,
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.mediumGray,
            marginTop: spacing.xs,
            fontFamily: typography.fontFamily.body,
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
};

// Feature Card
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  style?: React.CSSProperties;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  style = {},
}) => {
  return (
    <div
      style={{
        backgroundColor: colors.offWhite,
        borderRadius: 16,
        padding: spacing.lg,
        ...style,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: colors.primaryGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          marginBottom: spacing.md,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          color: colors.charcoal,
          fontFamily: typography.fontFamily.heading,
          margin: 0,
          marginBottom: spacing.xs,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: typography.fontSize.base,
          color: colors.darkGray,
          lineHeight: typography.lineHeight.relaxed,
          fontFamily: typography.fontFamily.body,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
};

// Timeline Item
interface TimelineItemProps {
  date: string;
  title: string;
  description: string;
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  date,
  title,
  description,
  isLast = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: spacing.md,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.primary,
          }}
        />
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              backgroundColor: colors.lightGray,
              marginTop: spacing.xs,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.lg }}>
        <div
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.primary,
            marginBottom: spacing.xs,
            fontFamily: typography.fontFamily.body,
          }}
        >
          {date}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.charcoal,
            marginBottom: spacing.xs,
            fontFamily: typography.fontFamily.heading,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.base,
            color: colors.darkGray,
            lineHeight: typography.lineHeight.relaxed,
            fontFamily: typography.fontFamily.body,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

// Bullet List
interface BulletListProps {
  items: string[];
  style?: React.CSSProperties;
}

export const BulletList: React.FC<BulletListProps> = ({
  items,
  style = {},
}) => {
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        ...style,
      }}
    >
      {items.map((item, index) => (
        <li
          key={index}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing.sm,
            marginBottom: spacing.sm,
            fontSize: typography.fontSize.lg,
            color: colors.darkGray,
            fontFamily: typography.fontFamily.body,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          <span
            style={{
              color: colors.primary,
              fontWeight: typography.fontWeight.bold,
              marginTop: 2,
            }}
          >
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
};

// Comparison Table Row
interface ComparisonRowProps {
  label: string;
  values: Array<{ text: string; highlight?: boolean }>;
  style?: React.CSSProperties;
}

export const ComparisonRow: React.FC<ComparisonRowProps> = ({
  label,
  values,
  style = {},
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `200px repeat(${values.length}, 1fr)`,
        gap: spacing.sm,
        padding: `${spacing.sm}px 0`,
        borderBottom: `1px solid ${colors.lightGray}`,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.medium,
          color: colors.charcoal,
          fontFamily: typography.fontFamily.body,
        }}
      >
        {label}
      </div>
      {values.map((val, index) => (
        <div
          key={index}
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: val.highlight ? typography.fontWeight.semibold : typography.fontWeight.normal,
            color: val.highlight ? colors.primary : colors.darkGray,
            textAlign: 'center',
            fontFamily: typography.fontFamily.body,
          }}
        >
          {val.text}
        </div>
      ))}
    </div>
  );
};
