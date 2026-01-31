import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TeaserVideo } from './TeaserVideo';
import { TeaserAudio } from '../components/Audio';

// Teaser Video with full audio (voiceover + background music + SFX)
export const TeaserVideoWithAudio: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Audio Track */}
      <TeaserAudio />
      
      {/* Visual Content */}
      <TeaserVideo />
    </AbsoluteFill>
  );
};
