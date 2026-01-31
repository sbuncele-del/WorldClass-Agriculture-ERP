import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, ScaleIn } from '../components/Animations';

export const TitleSlide: React.FC = () => {
  const frame = useCurrentFrame();

  // Background gradient animation
  const gradientProgress = interpolate(
    frame,
    [0, 120],
    [0, 100],
    { extrapolateRight: 'clamp' }
  );

  // Logo animation
  const logoScale = interpolate(
    frame,
    [0, 30],
    [0.5, 1],
    {
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    }
  );

  const logoOpacity = interpolate(
    frame,
    [0, 20],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: colors.white,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Subtle gradient background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at ${50 + gradientProgress * 0.2}% ${30 + gradientProgress * 0.1}%, rgba(0, 102, 255, 0.05) 0%, transparent 60%)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: spacing.xl,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            background: colors.primaryGradient,
            borderRadius: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0, 102, 255, 0.3)',
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: typography.fontWeight.bold,
              color: colors.white,
              fontFamily: typography.fontFamily.heading,
            }}
          >
            S
          </span>
        </div>
      </div>

      {/* Company Name */}
      <FadeInText delay={15} duration={30}>
        <h1
          style={{
            fontSize: typography.fontSize['6xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.charcoal,
            fontFamily: typography.fontFamily.heading,
            margin: 0,
            marginBottom: spacing.sm,
          }}
        >
          SiyaBusa ERP
        </h1>
      </FadeInText>

      {/* Tagline */}
      <FadeInText delay={35} duration={30}>
        <p
          style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.normal,
            color: colors.darkGray,
            fontFamily: typography.fontFamily.body,
            margin: 0,
            marginBottom: spacing['2xl'],
          }}
        >
          Enterprise Resource Planning for Africa
        </p>
      </FadeInText>

      {/* Company info */}
      <FadeInText delay={55} duration={30}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.lg,
            padding: `${spacing.md}px ${spacing.xl}px`,
            backgroundColor: colors.offWhite,
            borderRadius: 100,
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.charcoal,
              fontFamily: typography.fontFamily.body,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            Masaphokati Technologies (Pty) Ltd
          </span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
            }}
          />
          <span
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.darkGray,
              fontFamily: typography.fontFamily.body,
            }}
          >
            South Africa
          </span>
        </div>
      </FadeInText>

      {/* Seed Round Badge */}
      <FadeInText delay={75} duration={30}>
        <div
          style={{
            marginTop: spacing.xl,
            padding: `${spacing.sm}px ${spacing.lg}px`,
            background: colors.primaryGradient,
            borderRadius: 100,
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.base,
              color: colors.white,
              fontFamily: typography.fontFamily.body,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Seed Investment Round • Q1 2026
          </span>
        </div>
      </FadeInText>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: spacing.xl,
          fontSize: typography.fontSize.sm,
          color: colors.mediumGray,
          fontFamily: typography.fontFamily.body,
        }}
      >
        Confidential Investment Presentation
      </div>
    </AbsoluteFill>
  );
};
