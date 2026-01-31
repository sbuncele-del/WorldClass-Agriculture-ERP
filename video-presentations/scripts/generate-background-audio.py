#!/usr/bin/env python3
"""
SiyaBusa Video Presentation - Background Audio Generator
Creates subtle ambient corporate background music and transition sounds
"""

import numpy as np
from pathlib import Path
import wave
import struct

# Output directories
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "audio"
MUSIC_DIR = OUTPUT_DIR / "music"
SFX_DIR = OUTPUT_DIR / "sfx"

MUSIC_DIR.mkdir(parents=True, exist_ok=True)
SFX_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_RATE = 44100

def generate_sine_wave(freq, duration, amplitude=0.3, sample_rate=SAMPLE_RATE):
    """Generate a sine wave"""
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    wave = amplitude * np.sin(2 * np.pi * freq * t)
    return wave

def generate_envelope(duration, attack=0.1, decay=0.1, sustain_level=0.7, release=0.2, sample_rate=SAMPLE_RATE):
    """Generate ADSR envelope"""
    total_samples = int(sample_rate * duration)
    attack_samples = int(sample_rate * attack)
    decay_samples = int(sample_rate * decay)
    release_samples = int(sample_rate * release)
    sustain_samples = total_samples - attack_samples - decay_samples - release_samples
    
    envelope = np.concatenate([
        np.linspace(0, 1, attack_samples),
        np.linspace(1, sustain_level, decay_samples),
        np.ones(max(0, sustain_samples)) * sustain_level,
        np.linspace(sustain_level, 0, release_samples)
    ])
    
    return envelope[:total_samples]

def generate_pad_chord(freqs, duration, amplitude=0.15):
    """Generate a soft pad chord"""
    chord = np.zeros(int(SAMPLE_RATE * duration))
    envelope = generate_envelope(duration, attack=0.5, decay=0.3, sustain_level=0.6, release=0.5)
    
    for freq in freqs:
        wave = generate_sine_wave(freq, duration, amplitude / len(freqs))
        # Add slight detuning for richness
        wave += generate_sine_wave(freq * 1.003, duration, amplitude / len(freqs) * 0.3)
        wave += generate_sine_wave(freq * 0.997, duration, amplitude / len(freqs) * 0.3)
        chord += wave[:len(chord)]
    
    chord *= envelope[:len(chord)]
    return chord

def generate_corporate_ambient(duration_seconds=60):
    """Generate subtle corporate ambient background music"""
    print("Generating corporate ambient background music...")
    
    # Key of C major - corporate, professional feel
    # Chord progression: C - Am - F - G (classic corporate)
    chords = [
        [261.63, 329.63, 392.00],  # C major
        [220.00, 261.63, 329.63],  # A minor  
        [174.61, 220.00, 261.63],  # F major
        [196.00, 246.94, 293.66],  # G major
    ]
    
    chord_duration = 4  # 4 seconds per chord
    audio = np.array([])
    
    # Generate repeating chord progression
    while len(audio) / SAMPLE_RATE < duration_seconds:
        for chord_freqs in chords:
            chord = generate_pad_chord(chord_freqs, chord_duration, amplitude=0.08)
            audio = np.concatenate([audio, chord])
    
    # Trim to exact duration
    audio = audio[:int(SAMPLE_RATE * duration_seconds)]
    
    # Add very subtle low drone
    drone = generate_sine_wave(65.41, duration_seconds, amplitude=0.03)  # Low C
    audio += drone[:len(audio)]
    
    # Fade in/out
    fade_samples = int(SAMPLE_RATE * 2)
    audio[:fade_samples] *= np.linspace(0, 1, fade_samples)
    audio[-fade_samples:] *= np.linspace(1, 0, fade_samples)
    
    # Normalize
    audio = audio / np.max(np.abs(audio)) * 0.3
    
    return audio

def generate_whoosh_transition(duration=0.5):
    """Generate a subtle whoosh transition sound"""
    print("Generating whoosh transition...")
    
    samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, samples)
    
    # Frequency sweep from low to high
    freq_start = 200
    freq_end = 2000
    freq = freq_start * (freq_end / freq_start) ** (t / duration)
    
    # Generate swept sine wave
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    audio = 0.3 * np.sin(phase)
    
    # Apply envelope
    envelope = np.sin(np.pi * t / duration) ** 2
    audio *= envelope
    
    # Add some noise for texture
    noise = np.random.randn(samples) * 0.05
    noise_envelope = np.sin(np.pi * t / duration) ** 2
    audio += noise * noise_envelope
    
    return audio * 0.4

def generate_chime(freq=880, duration=1.0):
    """Generate a subtle notification chime"""
    print(f"Generating chime at {freq}Hz...")
    
    samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, samples)
    
    # Main tone
    audio = 0.3 * np.sin(2 * np.pi * freq * t)
    
    # Harmonics for richness
    audio += 0.15 * np.sin(2 * np.pi * freq * 2 * t)
    audio += 0.08 * np.sin(2 * np.pi * freq * 3 * t)
    
    # Quick attack, long decay envelope
    envelope = np.exp(-3 * t)
    audio *= envelope
    
    return audio * 0.5

def generate_success_sound():
    """Generate a pleasant success/completion sound"""
    print("Generating success sound...")
    
    duration = 0.8
    # Rising arpeggio: C - E - G
    freqs = [523.25, 659.25, 783.99]  # C5, E5, G5
    
    audio = np.array([])
    note_duration = duration / len(freqs)
    
    for freq in freqs:
        note = generate_sine_wave(freq, note_duration, 0.3)
        note += generate_sine_wave(freq * 2, note_duration, 0.1)  # Octave
        
        # Envelope
        env = np.exp(-2 * np.linspace(0, 1, len(note)))
        note *= env
        
        audio = np.concatenate([audio, note])
    
    # Add final chord
    chord_duration = 0.5
    chord = np.zeros(int(SAMPLE_RATE * chord_duration))
    for freq in freqs:
        chord += generate_sine_wave(freq, chord_duration, 0.15)
    chord *= np.exp(-2 * np.linspace(0, 1, len(chord)))
    
    audio = np.concatenate([audio, chord])
    
    return audio * 0.4

def save_wav(audio, filename, sample_rate=SAMPLE_RATE):
    """Save audio array to WAV file"""
    # Convert to 16-bit PCM
    audio_int = np.int16(audio * 32767)
    
    with wave.open(str(filename), 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_int.tobytes())
    
    print(f"  ✓ Saved: {filename}")

def main():
    print("\n🎵 SiyaBusa Audio Generator")
    print("=" * 40)
    
    # Generate background music (60 seconds for full video)
    print("\n📀 Background Music:")
    ambient_60s = generate_corporate_ambient(60)
    save_wav(ambient_60s, MUSIC_DIR / "corporate-ambient-60s.wav")
    
    # Generate 30 second version for teaser
    ambient_30s = generate_corporate_ambient(30)
    save_wav(ambient_30s, MUSIC_DIR / "corporate-ambient-30s.wav")
    
    # Generate sound effects
    print("\n🔊 Sound Effects:")
    whoosh = generate_whoosh_transition()
    save_wav(whoosh, SFX_DIR / "whoosh-transition.wav")
    
    chime = generate_chime(880)
    save_wav(chime, SFX_DIR / "chime.wav")
    
    chime_low = generate_chime(523.25)
    save_wav(chime_low, SFX_DIR / "chime-low.wav")
    
    success = generate_success_sound()
    save_wav(success, SFX_DIR / "success.wav")
    
    print("\n✅ All audio files generated!")
    print(f"\nMusic files: {MUSIC_DIR}")
    print(f"SFX files: {SFX_DIR}")

if __name__ == "__main__":
    main()
