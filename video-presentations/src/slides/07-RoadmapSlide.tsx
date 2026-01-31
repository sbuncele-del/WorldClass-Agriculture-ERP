import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, SlideIn, CountUp, ProgressBar } from '../components/Animations';
import { SlideLayout, Header, Footer, SectionTitle, TwoColumnLayout, TimelineItem } from '../components/Layouts';

export const RoadmapSlide: React.FC = () => {
  const frame = useCurrentFrame();

  const milestones = [
    {
      date: 'Q1 2026',
      title: 'Seed Round',
      description: 'R2M at R10M pre-money valuation',
      active: true,
    },
    {
      date: 'Q2 2026',
      title: 'First Customers',
      description: '10 paying customers onboarded',
      active: false,
    },
    {
      date: 'Q3-Q4 2026',
      title: 'Growth Phase',
      description: '25 customers, R150K MRR',
      active: false,
    },
    {
      date: 'Q1 2028',
      title: 'Series A',
      description: 'R15-25M at ~R80M pre-money',
      active: false,
    },
    {
      date: '2028',
      title: 'Scale',
      description: '200 customers, R2.4M MRR',
      active: false,
    },
    {
      date: 'Q2 2029',
      title: 'JSE AltX Listing',
      description: 'Public market liquidity',
      active: false,
    },
  ];

  return (
    <SlideLayout>
      <Header />

      <FadeInText delay={5} duration={25}>
        <SectionTitle
          label="Strategic Roadmap"
          title="Path to JSE AltX Listing"
          subtitle="Clear milestones from seed round to public listing"
        />
      </FadeInText>

      <TwoColumnLayout
        ratio="50-50"
        left={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              paddingTop: spacing.md,
            }}
          >
            {milestones.slice(0, 3).map((milestone, index) => (
              <SlideIn key={index} delay={20 + index * 15} duration={25} direction="left">
                <div
                  style={{
                    display: 'flex',
                    gap: spacing.md,
                    marginBottom: spacing.lg,
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
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: milestone.active ? colors.primary : colors.lightGray,
                        border: milestone.active ? `4px solid ${colors.primary}30` : 'none',
                      }}
                    />
                    {index < 2 && (
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
                  <div style={{ flex: 1, paddingBottom: spacing.sm }}>
                    <div
                      style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: milestone.active ? colors.primary : colors.mediumGray,
                        marginBottom: spacing.xs,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      {milestone.date}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.charcoal,
                        marginBottom: spacing.xs,
                        fontFamily: typography.fontFamily.heading,
                      }}
                    >
                      {milestone.title}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.base,
                        color: colors.darkGray,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      {milestone.description}
                    </div>
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        }
        right={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              paddingTop: spacing.md,
            }}
          >
            {milestones.slice(3).map((milestone, index) => (
              <SlideIn key={index} delay={65 + index * 15} duration={25} direction="right">
                <div
                  style={{
                    display: 'flex',
                    gap: spacing.md,
                    marginBottom: spacing.lg,
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
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: index === 2 ? colors.secondary : colors.lightGray,
                        border: index === 2 ? `4px solid ${colors.secondary}30` : 'none',
                      }}
                    />
                    {index < 2 && (
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
                  <div style={{ flex: 1, paddingBottom: spacing.sm }}>
                    <div
                      style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: index === 2 ? colors.secondary : colors.mediumGray,
                        marginBottom: spacing.xs,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      {milestone.date}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.charcoal,
                        marginBottom: spacing.xs,
                        fontFamily: typography.fontFamily.heading,
                      }}
                    >
                      {milestone.title}
                    </div>
                    <div
                      style={{
                        fontSize: typography.fontSize.base,
                        color: colors.darkGray,
                        fontFamily: typography.fontFamily.body,
                      }}
                    >
                      {milestone.description}
                    </div>
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        }
      />

      <Footer slideNumber={7} totalSlides={10} />
    </SlideLayout>
  );
};
