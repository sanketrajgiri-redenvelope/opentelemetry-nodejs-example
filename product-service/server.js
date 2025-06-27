// import express, { json } from 'express';
// import './telemetry.js'
import { Hono } from 'hono'
import { serve } from '@hono/node-server';
import mongoose from 'mongoose';
import logger from './logger.js';
const { connect, connection, Schema, model } = mongoose;

const app = new Hono();
const port = 3003;

const dbUrl = 'mongodb://mongodb:27017/products';
connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const ProductSchema = new Schema({
  name: String,
  price: Number,
  stock: Number
});
const Product = model('Product', ProductSchema);

// app.use(json());

app.get("/", async (c) => {
  logger.info("Product Service is running");
  return c.json({ "Status": `Product Service running on http://localhost:${port}` });
});

app.get('/products', async (c) => {
  logger.info("Fetching all products");
  const products = await Product.find();
  return c.json(products);
});

app.get('/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const product = await Product.findById(id);
    if (!product) {
      return c.json({ message: 'Product not found' }, 404);
    }
    return c.json(product);
  } catch (error) {
    return c.json({ message: 'Internal server error', details: error.message }, 500);
  }
});

app.post('/products', async (c) => {
  const body = await c.req.json();
  const newProduct = new Product(body);
  await newProduct.save();
  return c.json(newProduct, 201);
});

app.post('/products/:id/decrement-stock', async (c) => {
  const { decrementBy } = await c.req.json();
  const id = c.req.param('id');
  try {
    const product = await Product.findById(id);
    if (!product) {
      return c.json({ message: 'Product not found' }, 404);
    }
    if (product.stock < decrementBy) {
      return c.json({ message: 'Insufficient stock' }, 400);
    }
    product.stock -= decrementBy;
    await product.save();
    return c.json(product, 200);
  } catch (error) {
    return c.json({ message: 'Internal server error', details: error.message }, 500);
  }
});

app.post('/products/:id/increment-stock', async (c) => {
  const { incrementBy } = await c.req.json();
  const id = c.req.param('id');

  try {
    const product = await Product.findById(id);
    if (!product) {
      return c.json({ message: 'Product not found' }, 404);
    }

    product.stock += incrementBy;
    await product.save();

    return c.json(product, 200);
  } catch (error) {
    return c.json({ message: 'Internal server error', details: error.message }, 500);
  }
});

serve({ fetch: app.fetch, port });
logger.info(`Product Service running on http://localhost:${port}`);
