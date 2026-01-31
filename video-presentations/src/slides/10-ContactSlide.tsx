import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, ScaleIn } from '../components/Animations';

export const ContactSlide: React.FC = () => {
  const frame = useCurrentFrame();

  // Background gradient animation
  const gradientProgress = interpolate(
    frame,
    [0, 120],
    [0, 100],
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
          background: `radial-gradient(ellipse at ${50 + gradientProgress * 0.3}% ${50 - gradientProgress * 0.2}%, rgba(0, 102, 255, 0.08) 0%, transparent 70%)`,
        }}
      />

      {/* Logo */}
      <ScaleIn delay={0} duration={30}>
        <div
          style={{
            width: 100,
            height: 100,
            background: colors.primaryGradient,
            borderRadius: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
            boxShadow: '0 16px 32px rgba(0, 102, 255, 0.25)',
          }}
        >
          <span
            style={{
              fontSize: 52,
              fontWeight: typography.fontWeight.bold,
              color: colors.white,
              fontFamily: typography.fontFamily.heading,
            }}
          >
            S
          </span>
        </div>
      </ScaleIn>

      {/* Thank You */}
      <FadeInText delay={20} duration={30}>
        <h1
          style={{
            fontSize: typography.fontSize['5xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: colors.charcoal,
            fontFamily: typography.fontFamily.heading,
            margin: 0,
            marginBottom: spacing.md,
          }}
        >
          Thank You
        </h1>
      </FadeInText>

      <FadeInText delay={35} duration={30}>
        <p
          style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.normal,
            color: colors.darkGray,
            fontFamily: typography.fontFamily.body,
            margin: 0,
            marginBottom: spacing['3xl'],
          }}
        >
          Let's build the future of African enterprise together
        </p>
      </FadeInText>

      {/* Contact Details */}
      <FadeInText delay={50} duration={30}>
        <div
          style={{
            backgroundColor: colors.offWhite,
            borderRadius: 24,
            padding: spacing.xl,
            minWidth: 500,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.charcoal,
                fontFamily: typography.fontFamily.heading,
                margin: 0,
              }}
            >
              Masaphokati Technologies (Pty) Ltd
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.lg,
                color: colors.primary,
                fontFamily: typography.fontFamily.body,
                margin: 0,
                marginTop: spacing.xs,
              }}
            >
              Trading as SiyaBusa ERP
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
            }}
          >
            {[
              { icon: '📧', label: 'Email', value: 'investor@siyabusa.co.za' },
              { icon: '📱', label: 'Phone', value: '074 012 6873' },
              { icon: '🌐', label: 'Website', value: 'www.siyabusa.co.za' },
            ].map((contact, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.sm,
                }}
              >
                <span style={{ fontSize: 28 }}>{contact.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.mediumGray,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {contact.label}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.charcoal,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {contact.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeInText>

      {/* CTA */}
      <FadeInText delay={70} duration={30}>
        <div
          style={{
            marginTop: spacing.xl,
            padding: `${spacing.md}px ${spacing.xl}px`,
            background: colors.primaryGradient,
            borderRadius: 100,
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.white,
              fontFamily: typography.fontFamily.body,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Request a Demo Today
          </span>
        </div>
      </FadeInText>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.mediumGray,
            fontFamily: typography.fontFamily.body,
          }}
        >
          Confidential • For Authorized Recipients Only
        </span>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.mediumGray,
            fontFamily: typography.fontFamily.body,
          }}
        >
          January 2026
        </span>
      </div>
    </AbsoluteFill>
  );
};
