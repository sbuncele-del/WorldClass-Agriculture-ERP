import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Sequence } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, ScaleIn, CountUp } from '../components/Animations';

// 30-second teaser video for social media / quick pitch
export const TeaserVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.white }}>
      {/* Scene 1: Logo Reveal (0-90 frames / 3 seconds) */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ScaleIn delay={0} duration={30}>
            <div
              style={{
                width: 140,
                height: 140,
                background: colors.primaryGradient,
                borderRadius: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.lg,
                boxShadow: '0 24px 48px rgba(0, 102, 255, 0.3)',
              }}
            >
              <span
                style={{
                  fontSize: 72,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.white,
                  fontFamily: typography.fontFamily.heading,
                }}
              >
                S
              </span>
            </div>
          </ScaleIn>
          <FadeInText delay={20} duration={25}>
            <h1
              style={{
                fontSize: typography.fontSize['6xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: colors.charcoal,
                fontFamily: typography.fontFamily.heading,
                margin: 0,
              }}
            >
              SiyaBusa ERP
            </h1>
          </FadeInText>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2: Problem Statement (90-210 frames / 4 seconds) */}
      <Sequence from={90} durationInFrames={120}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing['3xl'],
          }}
        >
          <FadeInText delay={0} duration={25}>
            <div
              style={{
                fontSize: typography.fontSize['5xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.charcoal,
                fontFamily: typography.fontFamily.heading,
                textAlign: 'center',
                marginBottom: spacing.lg,
              }}
            >
              60,000+ Businesses
            </div>
          </FadeInText>
          <FadeInText delay={20} duration={25}>
            <div
              style={{
                fontSize: typography.fontSize['2xl'],
                color: colors.darkGray,
                fontFamily: typography.fontFamily.body,
                textAlign: 'center',
              }}
            >
              Trapped between expensive enterprise & limited basic software
            </div>
          </FadeInText>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 3: Solution (210-360 frames / 5 seconds) */}
      <Sequence from={210} durationInFrames={150}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing['3xl'],
          }}
        >
          <FadeInText delay={0} duration={25}>
            <div
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.primary,
                fontFamily: typography.fontFamily.body,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: spacing.md,
              }}
            >
              The Solution
            </div>
          </FadeInText>
          <FadeInText delay={15} duration={30}>
            <div
              style={{
                fontSize: typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.charcoal,
                fontFamily: typography.fontFamily.heading,
                textAlign: 'center',
                marginBottom: spacing.xl,
              }}
            >
              Full ERP • Native SA Compliance • AI-Powered
            </div>
          </FadeInText>
          <div
            style={{
              display: 'flex',
              gap: spacing.xl,
              marginTop: spacing.lg,
            }}
          >
            {['25+ Modules', 'R10K-R55K/mo', 'Cloud-Native'].map((item, index) => (
              <ScaleIn key={index} delay={40 + index * 15} duration={25}>
                <div
                  style={{
                    padding: `${spacing.md}px ${spacing.xl}px`,
                    backgroundColor: colors.offWhite,
                    borderRadius: 100,
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.charcoal,
                    fontFamily: typography.fontFamily.body,
                  }}
                >
                  {item}
                </div>
              </ScaleIn>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 4: Market Opportunity (360-480 frames / 4 seconds) */}
      <Sequence from={360} durationInFrames={120}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FadeInText delay={0} duration={25}>
            <div
              style={{
                fontSize: typography.fontSize['6xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: colors.primary,
                fontFamily: typography.fontFamily.heading,
              }}
            >
              R8.64 Billion
            </div>
          </FadeInText>
          <FadeInText delay={20} duration={25}>
            <div
              style={{
                fontSize: typography.fontSize['2xl'],
                color: colors.darkGray,
                fontFamily: typography.fontFamily.body,
                marginTop: spacing.md,
              }}
            >
              Total Addressable Market
            </div>
          </FadeInText>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 5: Investment Ask (480-630 frames / 5 seconds) */}
      <Sequence from={480} durationInFrames={150}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FadeInText delay={0} duration={25}>
            <div
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                color: colors.secondary,
                fontFamily: typography.fontFamily.body,
                marginBottom: spacing.md,
              }}
            >
              Seed Round Open
            </div>
          </FadeInText>
          <FadeInText delay={15} duration={30}>
            <div
              style={{
                fontSize: typography.fontSize['6xl'],
                fontWeight: typography.fontWeight.extrabold,
                color: colors.charcoal,
                fontFamily: typography.fontFamily.heading,
              }}
            >
              R2,000,000
            </div>
          </FadeInText>
          <FadeInText delay={35} duration={25}>
            <div
              style={{
                fontSize: typography.fontSize['2xl'],
                color: colors.darkGray,
                fontFamily: typography.fontFamily.body,
                marginTop: spacing.md,
              }}
            >
              at R10M Pre-Money Valuation
            </div>
          </FadeInText>
          <FadeInText delay={55} duration={25}>
            <div
              style={{
                marginTop: spacing.xl,
                padding: `${spacing.md}px ${spacing.xl}px`,
                backgroundColor: colors.success + '20',
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.success,
                  fontFamily: typography.fontFamily.body,
                }}
              >
                Target: 20x+ Return via JSE AltX IPO
              </span>
            </div>
          </FadeInText>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 6: CTA (630-750 frames / 4 seconds) */}
      <Sequence from={630} durationInFrames={120}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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
                marginBottom: spacing.lg,
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
          <FadeInText delay={15} duration={25}>
            <div
              style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.charcoal,
                fontFamily: typography.fontFamily.heading,
                marginBottom: spacing.md,
              }}
            >
              investor@siyabusa.co.za
            </div>
          </FadeInText>
          <FadeInText delay={30} duration={25}>
            <div
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                background: colors.primaryGradient,
                borderRadius: 100,
              }}
            >
              <span
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.white,
                  fontFamily: typography.fontFamily.body,
                }}
              >
                www.siyabusa.co.za
              </span>
            </div>
          </FadeInText>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
