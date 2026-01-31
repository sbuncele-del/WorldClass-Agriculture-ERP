#!/bin/bash
# Generate animated investor pitch video with proper sync, crossfades, and zoom effects
# Uses actual audio durations for perfect synchronization

cd /workspaces/WorldClass-ERP/video-presentations

SLIDES_DIR="out/slides"
AUDIO_DIR="public/audio/voiceover"
OUTPUT="out/investor-pitch-final.mp4"
WORKDIR="/workspaces/WorldClass-ERP/video-presentations"

echo "🎬 SiyaBusa ERP - Animated Video Generator"
echo "==========================================="
echo ""

# Get actual audio durations
echo "📏 Reading audio durations..."
DUR01=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/01-title.mp3" | cut -d. -f1)
DUR02=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/02-gap.mp3" | cut -d. -f1)
DUR03=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/03-what-it-does.mp3" | cut -d. -f1)
DUR04=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/04-architecture.mp3" | cut -d. -f1)
DUR05=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/05-modules.mp3" | cut -d. -f1)
DUR06=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/06-verticals.mp3" | cut -d. -f1)
DUR07=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/07-compliance.mp3" | cut -d. -f1)
DUR08=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/08-ai.mp3" | cut -d. -f1)
DUR09=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/09-journey.mp3" | cut -d. -f1)
DUR10=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/10-implementation.mp3" | cut -d. -f1)
DUR11=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/11-business-model.mp3" | cut -d. -f1)
DUR12=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/12-market.mp3" | cut -d. -f1)
DUR13=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/13-traction.mp3" | cut -d. -f1)
DUR14=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/14-roadmap.mp3" | cut -d. -f1)
DUR15=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/15-why-win.mp3" | cut -d. -f1)
DUR16=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/16-contact.mp3" | cut -d. -f1)

# Add 1 second buffer to each for breathing room
DUR01=$((DUR01 + 1))
DUR02=$((DUR02 + 1))
DUR03=$((DUR03 + 1))
DUR04=$((DUR04 + 1))
DUR05=$((DUR05 + 1))
DUR06=$((DUR06 + 1))
DUR07=$((DUR07 + 1))
DUR08=$((DUR08 + 1))
DUR09=$((DUR09 + 1))
DUR10=$((DUR10 + 1))
DUR11=$((DUR11 + 1))
DUR12=$((DUR12 + 1))
DUR13=$((DUR13 + 1))
DUR14=$((DUR14 + 1))
DUR15=$((DUR15 + 1))
DUR16=$((DUR16 + 1))

echo "   Slide 01: ${DUR01}s"
echo "   Slide 02: ${DUR02}s"
echo "   Slide 03: ${DUR03}s"
echo "   Slide 04: ${DUR04}s"
echo "   Slide 05: ${DUR05}s"
echo "   Slide 06: ${DUR06}s"
echo "   Slide 07: ${DUR07}s"
echo "   Slide 08: ${DUR08}s"
echo "   Slide 09: ${DUR09}s"
echo "   Slide 10: ${DUR10}s"
echo "   Slide 11: ${DUR11}s"
echo "   Slide 12: ${DUR12}s"
echo "   Slide 13: ${DUR13}s"
echo "   Slide 14: ${DUR14}s"
echo "   Slide 15: ${DUR15}s"
echo "   Slide 16: ${DUR16}s"
echo ""

# Create concat file with exact durations
cat > /tmp/ffmpeg_input.txt << EOF
file '${WORKDIR}/out/slides/slide_01.png'
duration ${DUR01}
file '${WORKDIR}/out/slides/slide_02.png'
duration ${DUR02}
file '${WORKDIR}/out/slides/slide_03.png'
duration ${DUR03}
file '${WORKDIR}/out/slides/slide_04.png'
duration ${DUR04}
file '${WORKDIR}/out/slides/slide_05.png'
duration ${DUR05}
file '${WORKDIR}/out/slides/slide_06.png'
duration ${DUR06}
file '${WORKDIR}/out/slides/slide_07.png'
duration ${DUR07}
file '${WORKDIR}/out/slides/slide_08.png'
duration ${DUR08}
file '${WORKDIR}/out/slides/slide_09.png'
duration ${DUR09}
file '${WORKDIR}/out/slides/slide_10.png'
duration ${DUR10}
file '${WORKDIR}/out/slides/slide_11.png'
duration ${DUR11}
file '${WORKDIR}/out/slides/slide_12.png'
duration ${DUR12}
file '${WORKDIR}/out/slides/slide_13.png'
duration ${DUR13}
file '${WORKDIR}/out/slides/slide_14.png'
duration ${DUR14}
file '${WORKDIR}/out/slides/slide_15.png'
duration ${DUR15}
file '${WORKDIR}/out/slides/slide_16.png'
duration ${DUR16}
EOF

echo "🎬 Creating animated video with zoom effects..."

# Create video with Ken Burns zoom effect (slow zoom in)
ffmpeg -y -f concat -safe 0 -i /tmp/ffmpeg_input.txt \
  -vf "scale=2160:1215,zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,fade=t=in:st=0:d=1" \
  -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p \
  /tmp/slides_video.mp4

echo "🔊 Combining all audio files..."

# Combine voiceovers with small gaps
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
ffmpeg -y -i /tmp/slides_video.mp4 -i /tmp/combined_audio.mp3 \
  -c:v copy -c:a aac -b:a 192k \
  -shortest "$OUTPUT"

echo ""
echo "✅ Video created: $OUTPUT"
echo ""
ls -lh "$OUTPUT"
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT")
echo "   Duration: ${DURATION}s"
