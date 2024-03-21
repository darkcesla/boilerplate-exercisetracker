const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();
const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to DB successfully");
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
}, { versionKey: false });

const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  userId: String
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({});
  res.send(users);
});

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  let user = await User.findOne({ username });

  if (user) {
    return res.json(user);
  }

  user = new User({ username });

  await user.save();

  res.json(user);
});

// Rute untuk menambahkan latihan ke pengguna tertentu
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;

  try {
    // Cari pengguna berdasarkan ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Buat objek latihan baru
    const exercise = new Exercise({
      userId,
      username: user.username,
      description,
      duration,
      date: date || new Date().toISOString().substring(0, 10),
    });

    // Simpan latihan ke database
    await exercise.save();

    // Kirim respons dengan objek latihan yang ditambahkan
    res.json(exercise);
  } catch (error) {
    console.error("Error adding exercise:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
