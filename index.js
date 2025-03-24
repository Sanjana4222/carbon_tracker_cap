const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully!');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

// User schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

// Contact Us schema
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String
});

const Contact = mongoose.model('Contact', contactSchema);

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(400).send('User not found.');
            }

            // Compare the provided password with the stored hashed password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err.message);
                    return res.status(500).send('Error logging in.');
                }
                if (!isMatch) {
                    return res.status(400).send('Invalid password.');
                }

                res.redirect('/dashboard.html'); // Redirect to dashboard
            });
        })
        .catch(err => {
            console.error('Error finding user:', err.message);
            res.status(500).send('Error logging in.');
        });
});

// Contact Us route
app.post('/contact', (req, res) => {
    const newContact = new Contact({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message
    });

    newContact.save()
        .then(() => {
            res.send({ message: 'Contact message sent successfully!' });
        })
        .catch(err => {
            console.error('Error saving contact message:', err.message);
            res.status(500).send('Error sending message.');
        });
});

// Signup route
app.post('/signup', (req, res) => {
    const newUser = new User({
        email: req.body.email,
        password: req.body.password
    });

    // Hash the password before saving the user
    bcrypt.hash(newUser.password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err.message);
            return res.status(500).send('Error registering user.');
        }
        newUser.password = hash;

        newUser.save()
            .then(() => {
                res.send({ message: 'User registered successfully!' }); // Send success message
            })
            .catch(err => {
                console.error('Error saving user:', err.message);
                res.status(500).send('Error registering user.');
            });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
