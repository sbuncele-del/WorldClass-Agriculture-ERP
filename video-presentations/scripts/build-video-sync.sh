#!/bin/bash
# Generate perfectly synced investor pitch video
# Each slide's duration exactly matches its audio clip

cd /workspaces/WorldClass-ERP/video-presentations

SLIDES_DIR="out/slides"
AUDIO_DIR="public/audio/voiceover"
OUTPUT="out/investor-pitch-final.mp4"
TEMP_DIR="/tmp/slide_clips"

echo "🎬 SiyaBusa ERP - Synced Video Generator"
echo "========================================"
echo ""

# Clean up temp
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Function to get exact audio duration
get_duration() {
    ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$1"
}

# Create video clips for each slide synced to its audio
create_clip() {
    local slide_num=$1
    local audio_file="$AUDIO_DIR/$2.mp3"
    local slide_file="$SLIDES_DIR/slide_${slide_num}.png"
    local output_file="$TEMP_DIR/clip_${slide_num}.mp4"
    
    local duration=$(get_duration "$audio_file")
    
    echo "📽️  Slide $slide_num: ${duration}s"
    
    # Create video from slide with exact audio duration, add subtle zoom effect
    ffmpeg -y -loop 1 -i "$slide_file" -i "$audio_file" \
        -vf "scale=2040:1148,zoompan=z='min(zoom+0.0003,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,fade=t=in:st=0:d=0.5,fade=t=out:st=${duration}:d=0.3" \
        -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
        -c:a aac -b:a 192k \
        -t "$duration" \
        -shortest \
        "$output_file" 2>/dev/null
}

echo "📏 Creating synced video clips..."
echo ""

# Create clips for all 16 slides
create_clip "01" "01-title"
create_clip "02" "02-gap"
create_clip "03" "03-what-it-does"
create_clip "04" "04-architecture"
create_clip "05" "05-modules"
create_clip "06" "06-verticals"
create_clip "07" "07-compliance"
create_clip "08" "08-ai"
create_clip "09" "09-journey"
create_clip "10" "10-implementation"
create_clip "11" "11-business-model"
create_clip "12" "12-market"
create_clip "13" "13-traction"
create_clip "14" "14-roadmap"
create_clip "15" "15-why-win"
create_clip "16" "16-contact"

echo ""
echo "🔗 Concatenating all clips..."

# Create concat list
cat > "$TEMP_DIR/concat.txt" << EOF
file 'clip_01.mp4'
file 'clip_02.mp4'
file 'clip_03.mp4'
file 'clip_04.mp4'
file 'clip_05.mp4'
file 'clip_06.mp4'
file 'clip_07.mp4'
file 'clip_08.mp4'
file 'clip_09.mp4'
file 'clip_10.mp4'
file 'clip_11.mp4'
file 'clip_12.mp4'
file 'clip_13.mp4'
file 'clip_14.mp4'
file 'clip_15.mp4'
file 'clip_16.mp4'
EOF

# Concatenate all clips
ffmpeg -y -f concat -safe 0 -i "$TEMP_DIR/concat.txt" \
    -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p \
    -c:a aac -b:a 192k \
    "$OUTPUT" 2>/dev/null

echo ""
echo "✅ Video created: $OUTPUT"
echo ""
ls -lh "$OUTPUT"
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT")
echo "   Duration: $(echo "$DURATION" | awk '{printf "%.0f", $1}')s ($(echo "$DURATION" | awk '{mins=int($1/60); secs=int($1%60); printf "%d:%02d", mins, secs}'))"

# Cleanup
rm -rf "$TEMP_DIR"
