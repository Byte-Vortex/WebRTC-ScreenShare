require('dotenv').config();
const AWS = require('@aws-sdk/client-s3');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { WebSocketServer } = require('ws');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors());

const uri = 'mongodb+srv://akshatanwar24:Akshat24Saini10@cluster0.faninty.mongodb.net/authDB?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. \nYou are now successfully connected to MongoDB Atlas!");

    mongoose.connection.on('connected', () => {
      console.log('Mongoose is connected to MongoDB');
    });

    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      loginLogs: [{ type: Date }],
      logoutLogs: [{ type: Date }],
    });

    const User = mongoose.model('User', userSchema);

    app.post('/api/users/login', async (req, res) => {
      const { username, password } = req.body;
      console.log('Received login request for:', username);

      try {
        const user = await User.findOne({ username });

        if (!user) {
          console.log('User not found');
          return res.status(401).send('Invalid Credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          console.log('Password match');
          try {
            const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '30m' });
            console.log('Generated token:', token);

            // Log login time
            user.loginLogs.push(new Date());
            await user.save();

            res.json({ success: true, token });
          } catch (error) {
            console.error('Error generating token:', error);
            res.status(500).send('Error generating token');
          }
        } else {
          console.log('Password does not match');
          res.status(401).send('Invalid Credentials');
        }
      } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error');
      }
    });

    app.post('/api/users/logout', async (req, res) => {
      const { username } = req.body;
      console.log('Received logout request for:', username);

      try {
        const user = await User.findOne({ username });

        if (!user) {
          console.log('User not found');
          return res.status(404).send('User not found');
        }

        // Log logout time
        user.logoutLogs.push(new Date());
        await user.save();

        res.json({ success: true, message: 'Logged out successfully' });
      } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('Server error');
      }
    });

    const port = 5000;
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      console.log('New client connected');

      ws.on('message', (message) => {
        const data = JSON.parse(message);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });

    // Schedule log upload to S3 every 1 hour
    setInterval(uploadLogsToS3, 3600000);

  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

run().catch(console.dir);

const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'webrtc-magic-server';
const LOG_FILE_PATH = path.join(__dirname, 'app.log');

async function uploadLogsToS3() {
  try {
    const logContent = await generateLogContent();
    fs.writeFileSync(LOG_FILE_PATH, logContent);

    const fileContent = fs.readFileSync(LOG_FILE_PATH);
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: `logs/app.log`,
      Body: fileContent,
    };

    const command = new PutObjectCommand(uploadParams);
    const data = await s3Client.send(command);
    console.log('Successfully uploaded logs to S3:', data);
  } catch (err) {
    console.error('Error uploading logs to S3:', err);
  }
}

async function generateLogContent() {
  try {
    const users = await User.find().lean();

    let logContent = '';
    users.forEach((user) => {
      logContent += `User: ${user.username}\n`;
      logContent += `Login Times:\n`;
      user.loginLogs.forEach((loginTime) => {
        logContent += `${loginTime}\n`;
      });
      logContent += `Logout Times:\n`;
      user.logoutLogs.forEach((logoutTime) => {
        logContent += `${logoutTime}\n`;
      });
      logContent += '\n';
    });

    return logContent;
  } catch (err) {
    console.error('Error generating log content:', err);
    return '';
  }
}