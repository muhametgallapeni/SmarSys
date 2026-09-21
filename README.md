# SmarSys static website

A zero-build static marketing website for SmarSys and Poligon App.

## Deploy to Azure Static Web Apps

Upload/deploy the contents of this folder as the app root. No build step is required.

- App location: `/`
- Build output location: leave empty
- API location: leave empty

## Contact email

The demo CTA currently uses `info@smarsys.net`. If you use another mailbox, replace the two `info@smarsys.net` occurrences in `index.html`.

## Languages

Albanian is the default language. English and German are switched client-side and the selected language is remembered in localStorage.

## Video

The demo player uses `assets/video/poligon-demo-ios.mp4`: H.264 Constrained Baseline Level 3.1, 8-bit YUV 4:2:0, 1280×720 at 30 fps, with MP4 fast-start metadata. It supports inline, user-initiated playback on iPhones as well as Android and desktop browsers. The source has no audio track.

The previous `poligon-demo-short.mp4` advertised H.264 Level 6.2, which can prevent iPhone playback. Keep the compatible encoding settings when replacing the demo. A new filename avoids reusing cached copies of the old video.

To regenerate with FFmpeg:

```sh
ffmpeg -i assets/video/poligon-demo-short.mp4 -map 0:v:0 -map '0:a?' -c:v libx264 -profile:v baseline -level:v 3.1 -pix_fmt yuv420p -vf 'scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=30' -crf 20 -preset medium -maxrate 5M -bufsize 10M -c:a aac -b:a 128k -ac 2 -movflags +faststart assets/video/poligon-demo-ios.mp4
```

After deployment, verify tap-to-play, seeking, and fullscreen on a physical iPhone in Safari and on Android. The host must serve MP4 files as `video/mp4` and support byte-range requests (`206 Partial Content`).
