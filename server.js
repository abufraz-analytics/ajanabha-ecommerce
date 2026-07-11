require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Static files serve karne ke liye
app.use(express.static(__dirname));

// Home route: ajnabha.html ko load karne ke liye
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ajanabha.html'));
});

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    image: String
}));

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'ajanabha_products', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] }
}) }).single('productImage');

// Security Middleware
const checkAdmin = (req, res, next) => {
    if (req.headers['admin-password'] !== process.env.ADMIN_CODE) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Invalid Password' });
    }
    next();
};

// Routes
app.post('/api/products', checkAdmin, (req, res) => {
    upload(req, res, async function (err) {
        if (err) return res.status(400).json({ success: false, message: 'Image upload failed' });
        try {
            const { name, price, category } = req.body;
            await new Product({ name, price: Number(price), category, image: req.file ? req.file.path : '' }).save();
            res.json({ success: true, message: 'Success' });
        } catch (dbErr) {
            res.status(500).json({ success: false, message: 'Database save failed' });
        }
    });
});

app.delete('/api/products/:id', checkAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Success' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
});

app.get('/api/products', async (req, res) => {
    try { res.json(await Product.find()); } 
    catch (err) { res.status(500).json({ message: 'Error fetching' }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));