const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const data = require('./data');
const Razorpay = require('razorpay');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const Product = mongoose.model(
  'products',
  new mongoose.Schema({
    name: String,
    description: String,
    image: String,
    price: Number,
    calorie: Number,
    category: String,
  })
);

app.get('/api/products/seed', async (req, res) => {
  await Product.remove({});
  const products = await Product.insertMany(data.products);
  res.send({ products });
});

app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  const products = await Product.find(category ? { category } : {});
  res.send(products);
});

app.post('/api/products', async (req, res) => {
  const newProduct = new Product(req.body);
  const savedProduct = await newProduct.save();
  res.send(savedProduct);
});

app.get('/api/categories', (req, res) => {
  res.send(data.categories);
});

const Order = mongoose.model(
  'Order',
  new mongoose.Schema(
    {
      number: { type: Number, default: 0 },
      orderType: String,
      paymentType: String,
      isPaid: { type: Boolean, default: false },
      isReady: { type: Boolean, default: false },
      inProgress: { type: Boolean, default: true },
      isCanceled: { type: Boolean, default: false },
      isDelivered: { type: Boolean, default: false },
      itemsPrice: Number,
      taxPrice: Number,
      totalPrice: Number,
      orderItems: [
        {
          name: String,
          price: Number,
          quantity: Number,
        },
      ],
    },
    {
      timestamps: true,
    }
  )
);

app.post('/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100, // Convert ₹ to paisa
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/api/orders', async (req, res) => {
  const orders = await Order.find({ isDelivered: false, isCanceled: false });
  res.send(orders);
});

app.put('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    if (req.body.action === 'ready') {
      order.isReady = true;
      order.inProgress = false;
    } else if (req.body.action === 'deliver') {
      order.isDelivered = true;
    } else if (req.body.action === 'cancel') {
      order.isCanceled = true;
    }
    await order.save();
    res.send({ message: 'Done' });
  } else {
    req.status(404).message({ message: 'Order not found' });
  }
});

app.post('/api/orders', async (req, res) => {
  const lastOrder = await Order.find().sort({ number: -1 }).limit(1);
  const lastNumber = lastOrder.length === 0 ? 0 : lastOrder[0].number;
  if (
    !req.body.orderType ||
    !req.body.paymentType ||
    !req.body.orderItems ||
    req.body.orderItems.length === 0
  ) {
    return res.send({ message: 'Data is required.' });
  }
  const order = await Order({ ...req.body, number: lastNumber + 1 }).save();
  res.send(order);
});

app.get('/api/orders/queue', async (req, res) => {
  const inProgressOrders = await Order.find(
    { inProgress: true, isCanceled: false },
    'number'
  );
  const servingOrders = await Order.find(
    { isReady: true, isDelivered: false },
    'number'
  );
  res.send({ inProgressOrders, servingOrders });
});

app.use(express.static(path.join(__dirname, '/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/build/index.html'));
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});
