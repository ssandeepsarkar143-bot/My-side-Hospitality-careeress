const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const rootDir = __dirname;

const htmlPages = new Set([
  'about.html',
  'admin-feed.html',
  'contact.html',
  'feedback.html',
  'help.html',
  'index.html',
  'job-post-from.html',
  'membership.html',
  'owner-feed.html',
  'prime-feed.html',
  'profile.html',
  'user-feed.html'
]);

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use('/attached_assets', express.static(path.join(rootDir, 'attached_assets')));
app.use('/public', express.static(path.join(rootDir, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.get('/logo.png', (req, res) => {
  res.sendFile(path.join(rootDir, 'logo.png'));
});

app.get('/:page', (req, res, next) => {
  const { page } = req.params;

  if (!htmlPages.has(page)) {
    return next();
  }

  res.sendFile(path.join(rootDir, page));
});

app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hospitality Careers server running on port ${PORT}`);
});
