import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, SlideIn, ScaleIn, CountUp, ProgressBar } from '../components/Animations';
import { SlideLayout, Header, Footer, SectionTitle, TwoColumnLayout } from '../components/Layouts';

export const InvestmentSlide: React.FC = () => {
  const frame = useCurrentFrame();

  const useOfFunds = [
    { label: 'Sales & Marketing', amount: 'R800,000', percent: 40, color: colors.primary },
    { label: 'Team Expansion', amount: 'R600,000', percent: 30, color: colors.secondary },
    { label: 'Operations', amount: 'R300,000', percent: 15, color: '#8B5CF6' },
    { label: 'Product Enhancement', amount: 'R200,000', percent: 10, color: colors.accent },
    { label: 'Working Capital', amount: 'R100,000', percent: 5, color: '#EC4899' },
  ];

  return (
    <SlideLayout>
      <Header />

      <FadeInText delay={5} duration={25}>
        <SectionTitle
          label="Investment Opportunity"
          title="Seed Round: R2,000,000"
          subtitle="Join us as we bring enterprise ERP to African mid-market businesses"
        />
      </FadeInText>

      <TwoColumnLayout
        ratio="50-50"
        left={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            {/* Deal Terms */}
            <SlideIn delay={20} duration={30} direction="left">
              <div
                style={{
                  backgroundColor: colors.primary + '10',
                  borderRadius: 20,
                  padding: spacing.xl,
                  border: `2px solid ${colors.primary}30`,
                  marginBottom: spacing.lg,
                }}
              >
                <h3
                  style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary,
                    fontFamily: typography.fontFamily.heading,
                    margin: 0,
                    marginBottom: spacing.lg,
                  }}
                >
                  Deal Terms
                </h3>
                {[
                  { label: 'Round', value: 'Seed' },
                  { label: 'Amount', value: 'R2,000,000' },
                  { label: 'Pre-Money Valuation', value: 'R10,000,000' },
                  { label: 'Equity Offered', value: '16.67%' },
                  { label: 'Instrument', value: 'Ordinary Shares' },
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: `${spacing.sm}px 0`,
                      borderBottom: index < 4 ? `1px solid ${colors.primary}20` : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: typography.fontSize.base,
                        color: colors.darkGray,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.charcoal,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </SlideIn>

            {/* Investor Returns */}
            <SlideIn delay={45} duration={30} direction="left">
              <div
                style={{
                  backgroundColor: colors.success + '15',
                  borderRadius: 16,
                  padding: spacing.lg,
                }}
              >
                <h4
                  style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.success,
                    fontFamily: typography.fontFamily.heading,
                    margin: 0,
                    marginBottom: spacing.md,
                  }}
                >
                  Projected Exit Returns (AltX IPO)
                </h4>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: typography.fontSize['2xl'],
                        fontWeight: typography.fontWeight.bold,
                        color: colors.charcoal,
                        fontFamily: typography.fontFamily.heading,
                      }}
                    >
                      R41.2M
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.darkGray,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      Base Case (20.6x)
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: typography.fontSize['2xl'],
                        fontWeight: typography.fontWeight.bold,
                        color: colors.success,
                        fontFamily: typography.fontFamily.heading,
                      }}
                    >
                      R61.7M
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.darkGray,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      Upside (30.9x)
                    </div>
                  </div>
                </div>
              </div>
            </SlideIn>
          </div>
        }
        right={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            {/* Use of Funds */}
            <SlideIn delay={30} duration={30} direction="right">
              <div
                style={{
                  backgroundColor: colors.offWhite,
                  borderRadius: 20,
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
                  Use of Funds
                </h3>
                {useOfFunds.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: spacing.md,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: spacing.xs,
                      }}
                    >
                      <span
                        style={{
                          fontSize: typography.fontSize.base,
                          color: colors.darkGray,
                          fontFamily: typography.fontFamily.body,
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.charcoal,
                          fontFamily: typography.fontFamily.body,
                        }}
                      >
                        {item.amount} ({item.percent}%)
                      </span>
                    </div>
                    <ProgressBar
                      progress={item.percent}
                      delay={50 + index * 8}
                      duration={30}
                      color={item.color}
                      height={10}
                    />
                  </div>
                ))}
              </div>
            </SlideIn>
          </div>
        }
      />

      <Footer slideNumber={9} totalSlides={10} />
    </SlideLayout>
  );
};
