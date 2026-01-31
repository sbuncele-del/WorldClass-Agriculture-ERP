import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, SlideIn, ScaleIn } from '../components/Animations';
import { SlideLayout, Header, Footer, SectionTitle, TwoColumnLayout, BulletList } from '../components/Layouts';

export const SolutionSlide: React.FC = () => {
  const frame = useCurrentFrame();

  const features = [
    'Full ERP Suite - 25+ integrated modules',
    'Native SA Compliance - SARS, B-BBEE, POPIA built-in',
    'AI-Powered - 9 specialized assistants',
    'Cloud-Native - Modern SaaS architecture',
    'Best Value - Enterprise features, accessible pricing',
  ];

  return (
    <SlideLayout>
      <Header />

      <FadeInText delay={5} duration={25}>
        <SectionTitle
          label="The Solution"
          title="SiyaBusa ERP"
          subtitle="Enterprise-grade ERP designed specifically for African mid-market businesses"
        />
      </FadeInText>

      <TwoColumnLayout
        ratio="60-40"
        left={
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            {features.map((feature, index) => (
              <FadeInText key={index} delay={25 + index * 12} duration={20}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: `${spacing.md}px 0`,
                    borderBottom: index < features.length - 1 ? `1px solid ${colors.lightGray}` : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      background: colors.primaryGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: colors.white,
                        fontSize: 20,
                        fontWeight: typography.fontWeight.bold,
                      }}
                    >
                      ✓
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: typography.fontSize.lg,
                      color: colors.charcoal,
                      fontFamily: typography.fontFamily.body,
                      fontWeight: typography.fontWeight.medium,
                    }}
                  >
                    {feature}
                  </span>
                </div>
              </FadeInText>
            ))}
          </div>
        }
        right={
          <SlideIn delay={40} duration={35} direction="right">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }}
            >
              {/* Pricing Comparison Card */}
              <div
                style={{
                  backgroundColor: colors.offWhite,
                  borderRadius: 24,
                  padding: spacing.xl,
                  width: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.primary,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: spacing.lg,
                    fontFamily: typography.fontFamily.body,
                  }}
                >
                  Pricing Sweet Spot
                </div>

                {/* Price Tiers */}
                {[
                  { label: 'Basic Accounting', price: 'R500-R1,500', opacity: 0.4 },
                  { label: 'SiyaBusa ERP', price: 'R10K-R55K', highlight: true },
                  { label: 'Enterprise ERP', price: 'R50K-R200K', opacity: 0.4 },
                ].map((tier, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                      backgroundColor: tier.highlight ? colors.primary + '15' : 'transparent',
                      borderRadius: 12,
                      border: tier.highlight ? `2px solid ${colors.primary}` : '2px solid transparent',
                      opacity: tier.opacity || 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: tier.highlight ? typography.fontWeight.semibold : typography.fontWeight.normal,
                        color: tier.highlight ? colors.primary : colors.darkGray,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      {tier.label}
                    </span>
                    <span
                      style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                        color: tier.highlight ? colors.primary : colors.darkGray,
                        fontFamily: typography.fontFamily.heading,
                      }}
                    >
                      {tier.price}
                    </span>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: spacing.lg,
                    padding: spacing.md,
                    backgroundColor: colors.success + '15',
                    borderRadius: 12,
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.success,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    More than basic. Less than enterprise.
                  </span>
                </div>
              </div>
            </div>
          </SlideIn>
        }
      />

      <Footer slideNumber={3} totalSlides={10} />
    </SlideLayout>
  );
};
