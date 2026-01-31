import React from 'react';
import { Composition, Sequence, AbsoluteFill } from 'remotion';
import { TitleSlide } from './slides/01-TitleSlide';
import { ProblemSlide } from './slides/02-ProblemSlide';
import { SolutionSlide } from './slides/03-SolutionSlide';
import { ModulesSlide } from './slides/04-ModulesSlide';
import { MarketSlide } from './slides/05-MarketSlide';
import { DifferentiatorsSlide } from './slides/06-DifferentiatorsSlide';
import { RoadmapSlide } from './slides/07-RoadmapSlide';
import { FinancialsSlide } from './slides/08-FinancialsSlide';
import { InvestmentSlide } from './slides/09-InvestmentSlide';
import { ContactSlide } from './slides/10-ContactSlide';
import { TeaserVideo } from './slides/TeaserVideo';
import { TeaserVideoWithAudio } from './slides/TeaserVideoWithAudio';
import { colors } from './components/Theme';
import { InvestorPitchAudio } from './components/Audio';

// Duration per slide in frames (at 30fps)
const SLIDE_DURATION = 150; // 5 seconds per slide

// Transition duration
const TRANSITION_DURATION = 15; // 0.5 seconds

// All slides configuration
const slides = [
  { id: 'title', component: TitleSlide },
  { id: 'problem', component: ProblemSlide },
  { id: 'solution', component: SolutionSlide },
  { id: 'modules', component: ModulesSlide },
  { id: 'market', component: MarketSlide },
  { id: 'differentiators', component: DifferentiatorsSlide },
  { id: 'roadmap', component: RoadmapSlide },
  { id: 'financials', component: FinancialsSlide },
  { id: 'investment', component: InvestmentSlide },
  { id: 'contact', component: ContactSlide },
];

// Main Investor Pitch Video Composition
export const InvestorPitchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.white }}>
      {/* Visual Slides */}
      {slides.map((slide, index) => {
        const SlideComponent = slide.component;
        return (
          <Sequence
            key={slide.id}
            from={index * SLIDE_DURATION}
            durationInFrames={SLIDE_DURATION + TRANSITION_DURATION}
          >
            <SlideComponent />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Investor Pitch with Audio
export const InvestorPitchVideoWithAudio: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.white }}>
      {/* Audio Track */}
      <InvestorPitchAudio slideDuration={SLIDE_DURATION} />
      
      {/* Visual Slides */}
      {slides.map((slide, index) => {
        const SlideComponent = slide.component;
        return (
          <Sequence
            key={slide.id}
            from={index * SLIDE_DURATION}
            durationInFrames={SLIDE_DURATION + TRANSITION_DURATION}
          >
            <SlideComponent />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Export configuration for Remotion
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full Investor Pitch Video (No Audio) */}
      <Composition
        id="InvestorPitch"
        component={InvestorPitchVideo}
        durationInFrames={slides.length * SLIDE_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />

      {/* Full Investor Pitch Video WITH Audio */}
      <Composition
        id="InvestorPitch-WithAudio"
        component={InvestorPitchVideoWithAudio}
        durationInFrames={slides.length * SLIDE_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />

      {/* 25-Second Teaser Video (No Audio) */}
      <Composition
        id="TeaserVideo"
        component={TeaserVideo}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />

      {/* 25-Second Teaser Video WITH Audio */}
      <Composition
        id="TeaserVideo-WithAudio"
        component={TeaserVideoWithAudio}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />

      {/* Square Format Teaser for Instagram/LinkedIn */}
      <Composition
        id="TeaserVideo-Square"
        component={TeaserVideo}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />

      {/* Individual Slides for Preview/Export */}
      {slides.map((slide, index) => {
        const SlideComponent = slide.component;
        return (
          <Composition
            key={slide.id}
            id={`Slide-${String(index + 1).padStart(2, '0')}-${slide.id}`}
            component={SlideComponent}
            durationInFrames={SLIDE_DURATION}
            fps={30}
            width={1920}
            height={1080}
            defaultProps={{}}
          />
        );
      })}
    </>
  );
};
