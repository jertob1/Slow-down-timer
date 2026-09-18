// routes/audio.js
import express from 'express';
import { spawn } from 'child_process';

const router = express.Router();

router.get('/audio', (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  console.log(`Fetching audio for: ${url}`);

  const ytdlp = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]);
  const ffmpeg = spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'mp3', 'pipe:1']);

  res.setHeader('Content-Type', 'audio/mpeg');

  ytdlp.stdout.pipe(ffmpeg.stdin);
  ffmpeg.stdout.pipe(res);

  // Log stderr from both — yt-dlp/ffmpeg write progress/info here even on success,
  // but this is also where you'll see actual errors if something breaks.
  ytdlp.stderr.on('data', (data) => {
    console.error(`yt-dlp: ${data.toString()}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    // ffmpeg is very verbose on stderr by default; uncomment to debug
    // console.error(`ffmpeg: ${data.toString()}`);
  });

  ytdlp.on('error', (err) => {
    console.error('Failed to start yt-dlp:', err);
    if (!res.headersSent) res.status(500).send('yt-dlp failed to start');
  });

  ffmpeg.on('error', (err) => {
    console.error('Failed to start ffmpeg:', err);
    if (!res.headersSent) res.status(500).send('ffmpeg failed to start');
  });

  ytdlp.on('close', (code) => {
    if (code !== 0) console.error(`yt-dlp exited with code ${code}`);
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0) console.error(`ffmpeg exited with code ${code}`);
  });

  // If the client disconnects (browser tab closed, request cancelled),
  // kill both child processes so they don't keep running uselessly.
  req.on('close', () => {
    console.log('Client disconnected, killing processes');
    ytdlp.kill();
    ffmpeg.kill();
  });
});

export default router;