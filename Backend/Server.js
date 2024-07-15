const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const http = require('http');
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express();
app.use(express.json());
app.use(cors());
const uri = 'mongodb+srv://akshatanwar24:Akshat24Saini10@cluster0.faninty.mongodb.net/authDB?retryWrites=true&w=majority&appName=Cluster0';
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    connectionId: { type: String, unique: true },
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
                const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '1h' });
                console.log('Generated token:', token);
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

app.get('/api/getConnectionId', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'secret');
        const userId = decoded.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const connectionId = user.connectionId;
        res.json({ connectionId });
    } catch (error) {
        console.error('Error fetching connectionId:', error);
        res.status(500).send('Error fetching connectionId');
    }
});

const server = http.createServer(app);
const port = 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('MongoDB Connected...');
});