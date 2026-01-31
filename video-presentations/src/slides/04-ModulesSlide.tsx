import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, typography, spacing } from '../components/Theme';
import { FadeInText, SlideIn, ScaleIn } from '../components/Animations';
import { SlideLayout, Header, Footer, SectionTitle, GridLayout } from '../components/Layouts';

export const ModulesSlide: React.FC = () => {
  const frame = useCurrentFrame();

  const moduleCategories = [
    {
      icon: '💰',
      title: 'Finance',
      modules: ['General Ledger', 'Cash Management', 'Asset Management', 'Treasury'],
      color: colors.primary,
    },
    {
      icon: '⚙️',
      title: 'Operations',
      modules: ['Sales & CRM', 'Purchase', 'Inventory', 'Warehouse', 'Manufacturing'],
      color: colors.secondary,
    },
    {
      icon: '👥',
      title: 'Human Resources',
      modules: ['Payroll (SARS)', 'Leave', 'Recruitment', 'Performance'],
      color: '#8B5CF6',
    },
    {
      icon: '✅',
      title: 'Compliance',
      modules: ['SARS Sentinel', 'Audit Ready', 'POPIA', 'B-BBEE'],
      color: colors.accent,
    },
    {
      icon: '🏭',
      title: 'Industry',
      modules: ['Healthcare', 'Mining', 'Construction', 'Property', 'Agriculture'],
      color: '#EC4899',
    },
    {
      icon: '🤖',
      title: 'Platform',
      modules: ['AI Assistant', 'Communications', 'Documents', 'Analytics'],
      color: '#06B6D4',
    },
  ];

  return (
    <SlideLayout>
      <Header />

      <FadeInText delay={5} duration={25}>
        <SectionTitle
          label="Complete Platform"
          title="25+ Integrated Modules"
          subtitle="Everything your business needs in one unified platform"
          centered
        />
      </FadeInText>

      <GridLayout columns={3} gap={spacing.lg} style={{ flex: 1, alignContent: 'center' }}>
        {moduleCategories.map((category, index) => (
          <ScaleIn key={index} delay={20 + index * 10} duration={25}>
            <div
              style={{
                backgroundColor: colors.offWhite,
                borderRadius: 20,
                padding: spacing.lg,
                height: '100%',
                borderTop: `4px solid ${category.color}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.md,
                }}
              >
                <span style={{ fontSize: 32 }}>{category.icon}</span>
                <h3
                  style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.charcoal,
                    fontFamily: typography.fontFamily.heading,
                    margin: 0,
                  }}
                >
                  {category.title}
                </h3>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: spacing.xs,
                }}
              >
                {category.modules.map((module, mIndex) => (
                  <span
                    key={mIndex}
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.darkGray,
                      backgroundColor: colors.white,
                      padding: `${spacing.xs / 2}px ${spacing.sm}px`,
                      borderRadius: 100,
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>
          </ScaleIn>
        ))}
      </GridLayout>

      <Footer slideNumber={4} totalSlides={10} />
    </SlideLayout>
  );
};
