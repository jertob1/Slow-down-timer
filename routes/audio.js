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

  // Handle errors on child process streams to prevent unhandled 'EPIPE' crashes
  ytdlp.on('error', (err) => {
    console.error('yt-dlp error:', err.message);
  });

  ffmpeg.on('error', (err) => {
    console.error('ffmpeg error:', err.message);
  });

  // Pipe streams safely with error handling
  ytdlp.stdout.on('error', (err) => {
    if (err.code !== 'EPIPE') console.log('ytdlp stdout error:', err);
  });

  ffmpeg.stdin.on('error', (err) => {
    if (err.code !== 'EPIPE') console.log('ffmpeg stdin error:', err);
  });

  ffmpeg.stdout.on('error', (err) => {
    if (err.code !== 'EPIPE') console.log('ffmpeg stdout error:', err);
  });

  // Perform the pipe operation
  ytdlp.stdout.pipe(ffmpeg.stdin);
  ffmpeg.stdout.pipe(res);

  // If the client disconnects, kill both child processes cleanly
  req.on('close', () => {
    if (!res.writableEnded) {
      console.log('Client disconnected, killing processes');
      try { ytdlp.kill('SIGKILL'); } catch (e) {}
      try { ffmpeg.kill('SIGKILL'); } catch (e) {}
    }
  });
});

export default router;