import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, SlideIn, ScaleIn, CountUp, ProgressBar } from '../components/Animations';
import { SlideLayout, Header, Footer, SectionTitle, TwoColumnLayout } from '../components/Layouts';

export const FinancialsSlide: React.FC = () => {
  const frame = useCurrentFrame();

  const projections = [
    { year: '2026', customers: '25', arr: 'R1.8M', ebitda: '-R1.0M' },
    { year: '2027', customers: '80', arr: 'R11.5M', ebitda: 'R1.2M' },
    { year: '2028', customers: '200', arr: 'R28.8M', ebitda: 'R4.0M' },
  ];

  return (
    <SlideLayout>
      <Header />

      <FadeInText delay={5} duration={25}>
        <SectionTitle
          label="Financial Projections"
          title="Growth Trajectory"
          subtitle="Conservative projections based on target market penetration"
        />
      </FadeInText>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xl,
        }}
      >
        {/* Projections Table */}
        <SlideIn delay={20} duration={30} direction="up">
          <div
            style={{
              backgroundColor: colors.offWhite,
              borderRadius: 20,
              padding: spacing.xl,
            }}
          >
            {/* Header Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: spacing.md,
                paddingBottom: spacing.md,
                borderBottom: `2px solid ${colors.lightGray}`,
                marginBottom: spacing.md,
              }}
            >
              {['Year', 'Customers', 'ARR', 'EBITDA'].map((header, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.mediumGray,
                    fontFamily: typography.fontFamily.body,
                    textAlign: index === 0 ? 'left' : 'center',
                  }}
                >
                  {header}
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {projections.map((row, index) => (
              <FadeInText key={index} delay={35 + index * 15} duration={20}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: spacing.md,
                    borderBottom: index < projections.length - 1 ? `1px solid ${colors.lightGray}` : 'none',
                    backgroundColor: index === 2 ? colors.primary + '10' : 'transparent',
                    borderRadius: index === 2 ? 12 : 0,
                    margin: index === 2 ? `0 -${spacing.md}px` : 0,
                    padding: index === 2 ? `${spacing.md}px ${spacing.md}px` : `${spacing.md}px 0`,
                  }}
                >
                  <div
                    style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.charcoal,
                      fontFamily: typography.fontFamily.heading,
                    }}
                  >
                    {row.year}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.charcoal,
                      fontFamily: typography.fontFamily.heading,
                      textAlign: 'center',
                    }}
                  >
                    {row.customers}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.primary,
                      fontFamily: typography.fontFamily.heading,
                      textAlign: 'center',
                    }}
                  >
                    {row.arr}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.semibold,
                      color: row.ebitda.startsWith('-') ? colors.error : colors.success,
                      fontFamily: typography.fontFamily.heading,
                      textAlign: 'center',
                    }}
                  >
                    {row.ebitda}
                  </div>
                </div>
              </FadeInText>
            ))}
          </div>
        </SlideIn>

        {/* Key Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing.lg,
          }}
        >
          {[
            { label: 'Target ARR by 2028', value: 'R28.8M', icon: '📈' },
            { label: 'Market Penetration', value: '0.33%', icon: '🎯' },
            { label: 'Path to Profitability', value: 'Q2 2027', icon: '✅' },
          ].map((metric, index) => (
            <ScaleIn key={index} delay={75 + index * 10} duration={20}>
              <div
                style={{
                  backgroundColor: colors.offWhite,
                  borderRadius: 16,
                  padding: spacing.lg,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: spacing.sm }}>{metric.icon}</div>
                <div
                  style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary,
                    fontFamily: typography.fontFamily.heading,
                    marginBottom: spacing.xs,
                  }}
                >
                  {metric.value}
                </div>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.darkGray,
                    fontFamily: typography.fontFamily.body,
                  }}
                >
                  {metric.label}
                </div>
              </div>
            </ScaleIn>
          ))}
        </div>
      </div>

      <Footer slideNumber={8} totalSlides={10} />
    </SlideLayout>
  );
};
