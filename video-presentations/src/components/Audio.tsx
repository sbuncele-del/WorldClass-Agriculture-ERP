import React from 'react';
import { Audio, interpolate, useCurrentFrame, staticFile, Sequence } from 'remotion';

// Audio file paths (relative to public folder)
export const audioFiles = {
  // Voiceovers
  voiceover: {
    title: staticFile('audio/voiceover/01-title.mp3'),
    problem: staticFile('audio/voiceover/02-problem.mp3'),
    solution: staticFile('audio/voiceover/03-solution.mp3'),
    modules: staticFile('audio/voiceover/04-modules.mp3'),
    market: staticFile('audio/voiceover/05-market.mp3'),
    differentiators: staticFile('audio/voiceover/06-differentiators.mp3'),
    roadmap: staticFile('audio/voiceover/07-roadmap.mp3'),
    financials: staticFile('audio/voiceover/08-financials.mp3'),
    investment: staticFile('audio/voiceover/09-investment.mp3'),
    contact: staticFile('audio/voiceover/10-contact.mp3'),
    teaser: staticFile('audio/voiceover/teaser.mp3'),
  },
  // Background music
  music: {
    ambient60: staticFile('audio/music/corporate-ambient-60s.wav'),
    ambient30: staticFile('audio/music/corporate-ambient-30s.wav'),
  },
  // Sound effects
  sfx: {
    whoosh: staticFile('audio/sfx/whoosh-transition.wav'),
    chime: staticFile('audio/sfx/chime.wav'),
    chimeLow: staticFile('audio/sfx/chime-low.wav'),
    success: staticFile('audio/sfx/success.wav'),
  },
};

// Background Music Component
interface BackgroundMusicProps {
  src: string;
  volume?: number;
  startFrom?: number;
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  src,
  volume = 0.5,
  startFrom = 0,
}) => {
  return (
    <Audio
      src={src}
      volume={volume}
      startFrom={startFrom}
    />
  );
};

// Voiceover Component with volume control
interface VoiceoverProps {
  src: string;
  volume?: number;
  startFrame?: number;
}

export const Voiceover: React.FC<VoiceoverProps> = ({
  src,
  volume = 0.9,
  startFrame = 10,
}) => {
  return (
    <Sequence from={startFrame}>
      <Audio
        src={src}
        volume={volume}
      />
    </Sequence>
  );
};

// Sound Effect Component
interface SoundEffectProps {
  src: string;
  volume?: number;
  startFrame?: number;
}

export const SoundEffect: React.FC<SoundEffectProps> = ({
  src,
  volume = 0.4,
  startFrame = 0,
}) => {
  return (
    <Sequence from={startFrame}>
      <Audio
        src={src}
        volume={volume}
      />
    </Sequence>
  );
};

// Transition Sound - plays whoosh at slide transitions
interface TransitionSoundProps {
  frame?: number;
}

export const TransitionSound: React.FC<TransitionSoundProps> = ({
  frame = 0,
}) => {
  return (
    <SoundEffect
      src={audioFiles.sfx.whoosh}
      volume={0.25}
      startFrame={frame}
    />
  );
};

// Full Audio Track for Investor Pitch
interface InvestorPitchAudioProps {
  slideDuration: number;
}

export const InvestorPitchAudio: React.FC<InvestorPitchAudioProps> = ({
  slideDuration,
}) => {
  const voiceovers = [
    { key: 'title', src: audioFiles.voiceover.title },
    { key: 'problem', src: audioFiles.voiceover.problem },
    { key: 'solution', src: audioFiles.voiceover.solution },
    { key: 'modules', src: audioFiles.voiceover.modules },
    { key: 'market', src: audioFiles.voiceover.market },
    { key: 'differentiators', src: audioFiles.voiceover.differentiators },
    { key: 'roadmap', src: audioFiles.voiceover.roadmap },
    { key: 'financials', src: audioFiles.voiceover.financials },
    { key: 'investment', src: audioFiles.voiceover.investment },
    { key: 'contact', src: audioFiles.voiceover.contact },
  ];

  return (
    <>
      {/* Background Music - subtle corporate ambient */}
      <BackgroundMusic
        src={audioFiles.music.ambient60}
        volume={0.3}
      />

      {/* Voiceovers for each slide */}
      {voiceovers.map((vo, index) => (
        <Sequence key={vo.key} from={index * slideDuration}>
          <Audio
            src={vo.src}
            volume={1}
          />
        </Sequence>
      ))}

      {/* Transition sounds between slides */}
      {voiceovers.slice(1).map((_, index) => (
        <TransitionSound
          key={`transition-${index}`}
          frame={(index + 1) * slideDuration - 5}
        />
      ))}

      {/* Success chime at the end */}
      <SoundEffect
        src={audioFiles.sfx.success}
        volume={0.3}
        startFrame={voiceovers.length * slideDuration - 60}
      />
    </>
  );
};

// Teaser Video Audio
export const TeaserAudio: React.FC = () => {
  return (
    <>
      {/* Background Music */}
      <BackgroundMusic
        src={audioFiles.music.ambient30}
        volume={0.15}
      />

      {/* Voiceover */}
      <Voiceover
        src={audioFiles.voiceover.teaser}
        volume={0.9}
        startFrame={15}
      />

      {/* Chime at logo reveal */}
      <SoundEffect
        src={audioFiles.sfx.chimeLow}
        volume={0.3}
        startFrame={20}
      />

      {/* Success at the end */}
      <SoundEffect
        src={audioFiles.sfx.success}
        volume={0.35}
        startFrame={650}
      />
    </>
  );
};
