require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect(process.env.MONGO_URI);

const Product = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, image: String }));
const Order = mongoose.model('Order', new mongoose.Schema({ productId: String, name: String, phone: String, address: String }));

app.get('/', (req, res) => res.sendFile(__dirname + '/ajanabha.html'));
app.get('/api/products', async (req, res) => res.json(await Product.find()));

// Naya Order Route
app.post('/api/orders', async (req, res) => {
    try {
        await new Order(req.body).save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// Admin routes... (Keep your existing delete/post logic here)
app.delete('/api/products/:id', async (req, res) => {
    // Add your auth check
    await Product.findByIdAndDelete(req.params.id);
    res.json({message: "Success"});
});

app.listen(process.env.PORT || 5000, () => console.log('Server Running'));
