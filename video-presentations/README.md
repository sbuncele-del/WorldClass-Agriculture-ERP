# SiyaBusa Video Presentations

Professional video presentations for the SiyaBusa ERP investor pitch, built with **Remotion** - a React-based video creation framework.

## 🎬 Overview

This project creates high-quality, animated video presentations that match the professional quality of our investor materials. Videos feature:

- Clean white backgrounds
- Smooth animations and transitions
- Professional typography (Inter font family)
- Consistent brand colors
- 1920x1080 HD resolution
- 30fps smooth playback
- **🎙️ Professional voiceover** (South African English)
- **🎵 Subtle background music**
- **🔊 Transition sound effects**

## 📽️ Video Content

The full investor pitch video consists of 10 slides:

| # | Slide | Duration | Content |
|---|-------|----------|---------|
| 1 | Title | 5s | SiyaBusa branding and seed round announcement |
| 2 | Problem | 5s | Market gap between Enterprise & Basic solutions |
| 3 | Solution | 5s | SiyaBusa's value proposition |
| 4 | Modules | 5s | 25+ integrated ERP modules overview |
| 5 | Market | 5s | R8.64B addressable market opportunity |
| 6 | Differentiators | 5s | Key competitive advantages |
| 7 | Roadmap | 5s | Path to JSE AltX listing |
| 8 | Financials | 5s | Growth projections 2026-2028 |
| 9 | Investment | 5s | Deal terms and use of funds |
| 10 | Contact | 5s | Contact information and CTA |

**Total Duration:** ~50 seconds

## 🎙️ Audio Features

### Voiceover
- **Voice:** South African English (Microsoft Edge TTS - Leah Neural)
- **Quality:** Natural, professional narration
- **Sync:** Timed to match slide animations

### Background Music
- Subtle corporate ambient track
- Non-distracting, professional feel
- Auto-fades at start/end

### Sound Effects
- Whoosh transitions between slides
- Chime accents at key moments
- Success sound at conclusion

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd video-presentations
npm install
```

### Preview Video (Development)

Launch the Remotion Studio to preview and edit videos in real-time:

```bash
npm start
```

This opens a browser-based studio where you can:
- Preview all slides with audio
- Scrub through the timeline
- See animations in real-time
- Export individual frames

### Build Full Video (with Audio)

Render the complete investor pitch video with voiceover and music:

```bash
npm run build
```

Output: `out/investor-pitch.mp4`

### Build Teaser Video (with Audio)

Render the 25-second social media teaser:

```bash
npm run build:teaser
```

Output: `out/teaser-video.mp4`

### Build All Videos

```bash
npm run build:all
```

### Regenerate Audio Files

```bash
# Regenerate voiceovers (requires Python + edge-tts)
npm run generate:voiceover

# Regenerate background music
npm run generate:music

# Regenerate all audio
npm run generate:audio
```

### Build Individual Slides

Export each slide as a separate video:

```bash
npm run build:slides
```

Output: `out/slides/01-title.mp4`, `out/slides/02-problem.mp4`, etc.

## 📁 Project Structure

```
video-presentations/
├── public/
│   └── audio/
│       ├── voiceover/        # Generated voiceover files
│       ├── music/            # Background music tracks
│       └── sfx/              # Sound effects
├── scripts/
│   ├── generate-voiceovers.py
│   └── generate-background-audio.py
├── src/
│   ├── components/
│   │   ├── Animations.tsx    # Reusable animation components
│   │   ├── Audio.tsx         # Audio components
│   │   ├── Layouts.tsx       # Layout templates
│   │   └── Theme.tsx         # Brand colors, typography
│   ├── slides/
│   │   ├── 01-TitleSlide.tsx
│   │   ├── 02-ProblemSlide.tsx
│   │   ├── 03-SolutionSlide.tsx
│   │   ├── 04-ModulesSlide.tsx
│   │   ├── 05-MarketSlide.tsx
│   │   ├── 06-DifferentiatorsSlide.tsx
│   │   ├── 07-RoadmapSlide.tsx
│   │   ├── 08-FinancialsSlide.tsx
│   │   ├── 09-InvestmentSlide.tsx
│   │   └── 10-ContactSlide.tsx
│   ├── Root.tsx              # Main composition
│   └── index.ts              # Entry point
├── out/                      # Rendered videos
├── package.json
├── remotion.config.ts
└── tsconfig.json
```

## 🎨 Customization

### Brand Colors

Edit `src/components/Theme.tsx`:

```typescript
export const colors = {
  primary: '#0066FF',      // Main brand blue
  secondary: '#00C853',    // Success green
  accent: '#FF6B35',       // Accent orange
  // ...
};
```

### Slide Duration

Edit `src/Root.tsx`:

```typescript
const SLIDE_DURATION = 150; // 5 seconds at 30fps
```

### Video Resolution

Edit `src/Root.tsx`:

```typescript
width={1920}   // Full HD
height={1080}
fps={30}
```

### Animation Components

Available animations in `src/components/Animations.tsx`:

- `FadeInText` - Fade in with upward motion
- `SlideIn` - Slide from any direction
- `ScaleIn` - Scale with bounce effect
- `Typewriter` - Character-by-character reveal
- `CountUp` - Animated number counter
- `ProgressBar` - Animated progress bar

## 🖥️ Export Options

### MP4 Video (Default)

```bash
npm run build
```

### Different Codecs

```bash
# ProRes (high quality, large file)
remotion render InvestorPitch out/investor-pitch.mov --codec=prores

# H.265 (smaller file)
remotion render InvestorPitch out/investor-pitch.mp4 --codec=h265
```

### Image Sequence

```bash
remotion render InvestorPitch out/frames --image-sequence
```

## 📋 Requirements

The video rendering requires:

- **CPU:** Multi-core processor recommended
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** ~500MB for full render

## 🔗 Integration

These videos complement the existing investor materials:

- `/docs/COMPANY-PROFILE.md` - Full company profile
- `/docs/investor-deck/` - PowerPoint presentations
- `/docs/executive-summary/` - PDF summaries

## 📄 License

Proprietary - Masaphokati Technologies (Pty) Ltd

---

**SiyaBusa ERP** - Enterprise Resource Planning for Africa

*January 2026*
