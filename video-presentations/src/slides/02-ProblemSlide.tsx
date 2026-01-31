import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, SlideIn, CountUp } from '../components/Animations';
import { SlideLayout, Header, Footer, SectionTitle, CenteredContent } from '../components/Layouts';

export const ProblemSlide: React.FC = () => {
  const frame = useCurrentFrame();

  const problemCards = [
    {
      title: 'Enterprise ERP',
      subtitle: 'SAP, Oracle, Microsoft',
      problem: 'R50K-R200K/month',
      extra: '+ R500K-R2M localization',
      icon: '🏢',
    },
    {
      title: 'Basic Accounting',
      subtitle: 'Xero, QuickBooks, Sage',
      problem: 'R500-R1,500/month',
      extra: 'Missing critical features',
      icon: '📒',
    },
  ];

  return (
    <SlideLayout>
      <Header />

      <FadeInText delay={5} duration={25}>
        <SectionTitle
          label="The Problem"
          title="60,000+ Businesses Are Stuck"
          subtitle="Mid-market companies in South Africa are trapped between two inadequate options"
        />
      </FadeInText>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing['3xl'],
        }}
      >
        {/* Left Card - Enterprise */}
        <SlideIn delay={25} duration={35} direction="left">
          <div
            style={{
              width: 400,
              backgroundColor: colors.offWhite,
              borderRadius: 24,
              padding: spacing.xl,
              border: `2px solid ${colors.error}20`,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: spacing.md }}>
              {problemCards[0].icon}
            </div>
            <h3
              style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.charcoal,
                fontFamily: typography.fontFamily.heading,
                margin: 0,
                marginBottom: spacing.xs,
              }}
            >
              {problemCards[0].title}
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.mediumGray,
                fontFamily: typography.fontFamily.body,
                margin: 0,
                marginBottom: spacing.lg,
              }}
            >
              {problemCards[0].subtitle}
            </p>
            <div
              style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.error,
                fontFamily: typography.fontFamily.heading,
                marginBottom: spacing.xs,
              }}
            >
              {problemCards[0].problem}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.base,
                color: colors.darkGray,
                fontFamily: typography.fontFamily.body,
              }}
            >
              {problemCards[0].extra}
            </div>
          </div>
        </SlideIn>

        {/* VS Badge */}
        <FadeInText delay={50} duration={20}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.charcoal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.white,
                fontFamily: typography.fontFamily.heading,
              }}
            >
              VS
            </span>
          </div>
        </FadeInText>

        {/* Right Card - Basic */}
        <SlideIn delay={35} duration={35} direction="right">
          <div
            style={{
              width: 400,
              backgroundColor: colors.offWhite,
              borderRadius: 24,
              padding: spacing.xl,
              border: `2px solid ${colors.warning}20`,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: spacing.md }}>
              {problemCards[1].icon}
            </div>
            <h3
              style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.charcoal,
                fontFamily: typography.fontFamily.heading,
                margin: 0,
                marginBottom: spacing.xs,
              }}
            >
              {problemCards[1].title}
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.mediumGray,
                fontFamily: typography.fontFamily.body,
                margin: 0,
                marginBottom: spacing.lg,
              }}
            >
              {problemCards[1].subtitle}
            </p>
            <div
              style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.warning,
                fontFamily: typography.fontFamily.heading,
                marginBottom: spacing.xs,
              }}
            >
              {problemCards[1].problem}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.base,
                color: colors.darkGray,
                fontFamily: typography.fontFamily.body,
              }}
            >
              {problemCards[1].extra}
            </div>
          </div>
        </SlideIn>
      </div>

      {/* Bottom Summary */}
      <FadeInText delay={70} duration={25}>
        <div
          style={{
            textAlign: 'center',
            padding: spacing.lg,
            backgroundColor: colors.error + '10',
            borderRadius: 16,
            marginTop: spacing.lg,
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.charcoal,
              fontFamily: typography.fontFamily.body,
              fontWeight: typography.fontWeight.medium,
              margin: 0,
            }}
          >
            <strong>Result:</strong> Disconnected systems, inefficiency, and compliance risk
          </p>
        </div>
      </FadeInText>

      <Footer slideNumber={2} totalSlides={10} />
    </SlideLayout>
  );
};
