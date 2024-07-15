// Import necessary modules
const mongoose=require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB Atlas URI
const uri = 'mongodb+srv://akshatanwar24:Akshat24Saini10@cluster0.faninty.mongodb.net/authDB?retryWrites=true&w=majority&appName=Cluster0';

// Define the User schema and model
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  connectionId: {
    type: String,
    unique: true
  }
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Function to generate a unique connectionId
function generateConnectionId(length = 8) {
  const minLength = 10;
  const finalLength = Math.max(length, minLength);
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let connectionId = '';
  for (let i = 0; i < finalLength; i++) {
    connectionId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return connectionId;
}

// Function to create a user with hashed password and unique connectionId
async function createUser(username, plaintextPassword) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plaintextPassword, saltRounds);

    let uniqueConnectionId;
    let connectionIdExists = true;

    while (connectionIdExists) {
      uniqueConnectionId = generateConnectionId(8);
      const existingUser = await User.findOne({ connectionId: uniqueConnectionId });
      if (!existingUser) {
        connectionIdExists = false;
      }
    }

    const newUser = new User({
      username: username,
      password: hashedPassword,
      connectionId: uniqueConnectionId // Generate a unique connectionId for each user
    });

    await newUser.save();
    console.log(`User ${username} created successfully`);
  } catch (err) {
    console.error(`Error creating user ${username}:`, err.message);
  }
}

// Usage example
const users = [
  { username: 'NWR', password: '1811' },
  { username: 'Admin', password: '2410' },
  { username: 'Root', password: '0610' },
  { username: 'Akshat@24', password: '9461767567' },
  { username: 'akshatanwar24@gmail.com', password: '9414540086' }
];

users.forEach(user => createUser(user.username, user.password));