import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, SlideIn, CountUp, ProgressBar } from '../components/Animations';
import { SlideLayout, Header, Footer, SectionTitle, TwoColumnLayout, StatBox } from '../components/Layouts';

export const MarketSlide: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SlideLayout>
      <Header />

      <FadeInText delay={5} duration={25}>
        <SectionTitle
          label="Market Opportunity"
          title="R8.64 Billion Addressable Market"
          subtitle="South African mid-market businesses need modern, compliant ERP solutions"
        />
      </FadeInText>

      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: spacing.xl,
        }}
      >
        {/* Left - Stats */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <SlideIn delay={20} duration={30} direction="left">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing.lg,
              }}
            >
              {[
                { value: '60,000+', label: 'Target Businesses', sublabel: 'In South Africa' },
                { value: 'R10M-R500M', label: 'Revenue Range', sublabel: 'Sweet spot' },
                { value: 'R12,000', label: 'Avg Monthly Spend', sublabel: 'Per business' },
                { value: 'R8.64B', label: 'TAM', sublabel: 'Per year' },
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: colors.offWhite,
                    borderRadius: 16,
                    padding: spacing.lg,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: typography.fontSize['3xl'],
                      fontWeight: typography.fontWeight.extrabold,
                      color: colors.primary,
                      fontFamily: typography.fontFamily.heading,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.charcoal,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.mediumGray,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {stat.sublabel}
                  </div>
                </div>
              ))}
            </div>
          </SlideIn>
        </div>

        {/* Right - Market Gap Visualization */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <SlideIn delay={35} duration={30} direction="right">
            <div
              style={{
                backgroundColor: colors.offWhite,
                borderRadius: 24,
                padding: spacing.xl,
              }}
            >
              <h3
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.charcoal,
                  fontFamily: typography.fontFamily.heading,
                  margin: 0,
                  marginBottom: spacing.lg,
                }}
              >
                The Market Gap
              </h3>

              {/* Gap Visualization */}
              <div style={{ marginBottom: spacing.lg }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: spacing.xs,
                  }}
                >
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.darkGray,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    Basic Accounting
                  </span>
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.darkGray,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    Enterprise ERP
                  </span>
                </div>
                <div
                  style={{
                    height: 32,
                    backgroundColor: colors.lightGray,
                    borderRadius: 16,
                    overflow: 'hidden',
                    display: 'flex',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '20%',
                      backgroundColor: colors.warning + '60',
                      height: '100%',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      background: colors.primaryGradient,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: colors.white,
                        fontWeight: typography.fontWeight.bold,
                        fontSize: typography.fontSize.sm,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      SiyaBusa Territory
                    </span>
                  </div>
                  <div
                    style={{
                      width: '20%',
                      backgroundColor: colors.error + '60',
                      height: '100%',
                    }}
                  />
                </div>
              </div>

              {/* Key Points */}
              {[
                { icon: '⚠️', text: 'Too expensive for mid-market (Enterprise)' },
                { icon: '⚠️', text: 'Too limited for operations (Basic)' },
                { icon: '✅', text: 'SiyaBusa fills the gap perfectly' },
              ].map((point, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.xs,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{point.icon}</span>
                  <span
                    style={{
                      fontSize: typography.fontSize.base,
                      color: colors.darkGray,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {point.text}
                  </span>
                </div>
              ))}
            </div>
          </SlideIn>
        </div>
      </div>

      <Footer slideNumber={5} totalSlides={10} />
    </SlideLayout>
  );
};
