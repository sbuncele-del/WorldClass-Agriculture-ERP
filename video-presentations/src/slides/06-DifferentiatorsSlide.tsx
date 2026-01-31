import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, SlideIn, ScaleIn } from '../components/Animations';
import { SlideLayout, Header, Footer, SectionTitle, GridLayout, FeatureCard } from '../components/Layouts';

export const DifferentiatorsSlide: React.FC = () => {
  const frame = useCurrentFrame();

  const differentiators = [
    {
      icon: '🇿🇦',
      title: 'Native SA Compliance',
      description: 'PAYE, UIF, SDL, SARS submissions, B-BBEE tracking, POPIA built in from day one. No expensive localization.',
      highlight: 'Saves R500K-R2M',
    },
    {
      icon: '💰',
      title: 'Best Value Pricing',
      description: 'Full ERP capabilities at R10K-R55K/month. More than basic accounting, less than enterprise pricing.',
      highlight: '40% lower cost',
    },
    {
      icon: '🤖',
      title: 'AI-Powered Intelligence',
      description: '9 specialized AI assistants for natural language queries, automated insights, and intelligent automation.',
      highlight: '24/7 assistance',
    },
    {
      icon: '☁️',
      title: 'Modern Architecture',
      description: 'Cloud-native SaaS with real-time dashboards, mobile responsive design, and API-first integrations.',
      highlight: 'No on-premise',
    },
  ];

  return (
    <SlideLayout>
      <Header />

      <FadeInText delay={5} duration={25}>
        <SectionTitle
          label="Competitive Advantage"
          title="Why SiyaBusa Wins"
          subtitle="Key differentiators that set us apart from both enterprise and basic solutions"
          centered
        />
      </FadeInText>

      <GridLayout columns={2} gap={spacing.xl} style={{ flex: 1, alignContent: 'center' }}>
        {differentiators.map((diff, index) => (
          <ScaleIn key={index} delay={20 + index * 15} duration={25}>
            <div
              style={{
                backgroundColor: colors.offWhite,
                borderRadius: 20,
                padding: spacing.xl,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: spacing.md,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: colors.primaryGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                  }}
                >
                  {diff.icon}
                </div>
                <span
                  style={{
                    padding: `${spacing.xs}px ${spacing.sm}px`,
                    backgroundColor: colors.success + '20',
                    color: colors.success,
                    borderRadius: 100,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    fontFamily: typography.fontFamily.body,
                  }}
                >
                  {diff.highlight}
                </span>
              </div>
              <h3
                style={{
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.charcoal,
                  fontFamily: typography.fontFamily.heading,
                  margin: 0,
                  marginBottom: spacing.sm,
                }}
              >
                {diff.title}
              </h3>
              <p
                style={{
                  fontSize: typography.fontSize.lg,
                  color: colors.darkGray,
                  fontFamily: typography.fontFamily.body,
                  lineHeight: typography.lineHeight.relaxed,
                  margin: 0,
                  flex: 1,
                }}
              >
                {diff.description}
              </p>
            </div>
          </ScaleIn>
        ))}
      </GridLayout>

      <Footer slideNumber={6} totalSlides={10} />
    </SlideLayout>
  );
};
