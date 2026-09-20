// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import audioRoutes from './routes/audio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// app.use(cors());

// Serve static files (like index.js) from the root directory so the browser can load them
app.use(express.static(__dirname));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use('/api', audioRoutes);

app.listen(3001, () => {
  console.log('Listening on http://localhost:3001');
});
