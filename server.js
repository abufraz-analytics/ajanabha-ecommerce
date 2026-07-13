require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect(process.env.MONGO_URI);
const Product = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, image: String }));
const Order = mongoose.model('Order', new mongoose.Schema({ productId: String, name: String, phone: String, address: String }));

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const upload = multer({ storage: new CloudinaryStorage({ cloudinary, params: { folder: 'ajanabha_products' } }) }).single('productImage');

const checkAdmin = (req, res, next) => req.headers['admin-password'] === process.env.ADMIN_CODE ? next() : res.status(403).send();

app.get('/', (req, res) => res.sendFile(__dirname + '/ajanabha.html'));
app.get('/api/products', async (req, res) => res.json(await Product.find()));
app.get('/api/orders', checkAdmin, async (req, res) => {
    const orders = await Order.find();
    const products = await Product.find();
    res.json(orders.map(o => {
        const p = products.find(prod => prod._id.toString() === o.productId);
        return { ...o._doc, prodName: p ? p.name : 'Deleted Item', prodImg: p ? p.image : '' };
    }));
});
app.post('/api/products', checkAdmin, upload, async (req, res) => {
    await new Product({ name: req.body.name, price: req.body.price, image: req.file.path }).save();
    res.json({ message: "Success" });
});
app.post('/api/orders', async (req, res) => { await new Order(req.body).save(); res.json({ message: "Success" }); });
app.delete('/api/products/:id', checkAdmin, async (req, res) => {
    const p = await Product.findById(req.params.id);
    if(p && p.image) {
        const publicId = 'ajanabha_products/' + p.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({message: "Success"});
});
app.delete('/api/orders/:id', checkAdmin, async (req, res) => { await Order.findByIdAndDelete(req.params.id); res.json({message: "Success"}); });
app.listen(process.env.PORT || 5000, () => console.log('Server Live'));
