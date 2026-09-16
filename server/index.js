require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const Thread = require('./models/Thread');
const profileRoutes = require('./routes/profile');
const todoRoutes = require('./routes/todos');
const forumRoutes = require('./routes/forum');
const feedRoutes = require('./routes/feed');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/profile', profileRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/feed', feedRoutes);

// Serve the static frontend (index.html, signup.html, etc.) from the project root.
app.use(express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    'Missing MONGODB_URI. Copy server/.env.example to server/.env and fill in your MongoDB Atlas connection string.'
  );
  process.exit(1);
}

async function seedForum() {
  const count = await Thread.countDocuments();
  if (count > 0) return;
  await Thread.insertMany([
    {
      title: 'Anyone successfully applied for the new $8,000 income ceiling yet?',
      body: 'Household income is $7,800 — wondering how HDB verifies this at application stage and whether CPF contributions count towards the figure.',
      category: 'housing',
      author: 'Mei Wen',
      replies: 42,
    },
    {
      title: 'Voluntary top-up before year end — worth it for a 32 year-old?',
      body: 'Trying to decide between the tax relief now versus keeping cash liquid for a resale flat downpayment next year. How are others weighing this?',
      category: 'cpf',
      author: 'Ravi K.',
      replies: 17,
    },
    {
      title: 'PSA: Cost-of-Living payout is auto-credited, no application needed',
      body: "Saw a few people asking where to apply — confirmed with a friend at a CC that it's automatic via PayNow-NRIC or bank crediting, just make sure that's linked.",
      category: 'general',
      author: 'Su Ling',
      replies: 28,
    },
  ]);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    await seedForum();
    app.listen(PORT, () => {
      console.log(`KaypohKaki server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
