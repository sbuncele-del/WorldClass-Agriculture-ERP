#!/bin/bash
# Generate final investor pitch video using FFmpeg
# Combines slide images with ElevenLabs voiceovers

cd /workspaces/WorldClass-ERP/video-presentations

SLIDES_DIR="out/slides"
AUDIO_DIR="public/audio/voiceover"
OUTPUT="out/investor-pitch-final.mp4"
WORKDIR="/workspaces/WorldClass-ERP/video-presentations"

# Create concat file for slides with audio (use absolute paths)
cat > /tmp/ffmpeg_input.txt << EOF
file '${WORKDIR}/out/slides/slide_01.png'
duration 12
file '${WORKDIR}/out/slides/slide_02.png'
duration 22
file '${WORKDIR}/out/slides/slide_03.png'
duration 28
file '${WORKDIR}/out/slides/slide_04.png'
duration 24
file '${WORKDIR}/out/slides/slide_05.png'
duration 26
file '${WORKDIR}/out/slides/slide_06.png'
duration 24
file '${WORKDIR}/out/slides/slide_07.png'
duration 24
file '${WORKDIR}/out/slides/slide_08.png'
duration 26
file '${WORKDIR}/out/slides/slide_09.png'
duration 22
file '${WORKDIR}/out/slides/slide_10.png'
duration 20
file '${WORKDIR}/out/slides/slide_11.png'
duration 20
file '${WORKDIR}/out/slides/slide_12.png'
duration 22
file '${WORKDIR}/out/slides/slide_13.png'
duration 18
file '${WORKDIR}/out/slides/slide_14.png'
duration 22
file '${WORKDIR}/out/slides/slide_15.png'
duration 18
file '${WORKDIR}/out/slides/slide_16.png'
duration 16
EOF

echo "🎬 Creating video from slides..."

# First create video from slides
ffmpeg -y -f concat -safe 0 -i /tmp/ffmpeg_input.txt -vsync vfr -pix_fmt yuv420p -c:v libx264 /tmp/slides_video.mp4

echo "🔊 Combining all audio files..."

# Combine all voiceovers into one audio track with gaps
ffmpeg -y \
  -i "$AUDIO_DIR/01-title.mp3" \
  -i "$AUDIO_DIR/02-gap.mp3" \
  -i "$AUDIO_DIR/03-what-it-does.mp3" \
  -i "$AUDIO_DIR/04-architecture.mp3" \
  -i "$AUDIO_DIR/05-modules.mp3" \
  -i "$AUDIO_DIR/06-verticals.mp3" \
  -i "$AUDIO_DIR/07-compliance.mp3" \
  -i "$AUDIO_DIR/08-ai.mp3" \
  -i "$AUDIO_DIR/09-journey.mp3" \
  -i "$AUDIO_DIR/10-implementation.mp3" \
  -i "$AUDIO_DIR/11-business-model.mp3" \
  -i "$AUDIO_DIR/12-market.mp3" \
  -i "$AUDIO_DIR/13-traction.mp3" \
  -i "$AUDIO_DIR/14-roadmap.mp3" \
  -i "$AUDIO_DIR/15-why-win.mp3" \
  -i "$AUDIO_DIR/16-contact.mp3" \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a][8:a][9:a][10:a][11:a][12:a][13:a][14:a][15:a]concat=n=16:v=0:a=1[outa]" \
  -map "[outa]" \
  /tmp/combined_audio.mp3

echo "🎥 Merging video and audio..."

# Merge video with audio
ffmpeg -y -i /tmp/slides_video.mp4 -i /tmp/combined_audio.mp3 -c:v copy -c:a aac -shortest "$OUTPUT"

echo ""
echo "✅ Video created: $OUTPUT"
echo ""
ls -lh "$OUTPUT"
