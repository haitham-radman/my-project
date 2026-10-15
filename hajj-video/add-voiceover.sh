#!/bin/bash
# Mixes voice/01..13.(mp3|wav|m4a) over the video at the scene start times in narration.md.
cd "$(dirname "$0")"
T=(0.8 5.6 12.6 19.6 27.6 33.6 40.6 46.6 52.6 59.6 65.6 70.6 78.0)
IN=(-i hajj-journey-alrifada.mp4); FC=""; MIX="[0:a]volume=0.45[m]"; LAB="[m]"; n=1
for i in $(seq 1 13); do
  f=$(ls voice/$(printf %02d $i).* 2>/dev/null | head -1); [ -z "$f" ] && { echo "missing voice/$(printf %02d $i)"; exit 1; }
  ms=$(python3 -c "print(int(${T[$((i-1))]}*1000))")
  IN+=(-i "$f"); FC+="[$n:a]adelay=${ms}|${ms},volume=1.6[v$i];"; LAB+="[v$i]"; n=$((n+1))
done
ffmpeg -y -loglevel error "${IN[@]}" -filter_complex "$FC$MIX;${LAB}amix=inputs=14:normalize=0:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart hajj-journey-alrifada-voice.mp4 && echo done
