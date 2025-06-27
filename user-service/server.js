// import express, { json } from 'express';
// import "./telemetry.js";
import { Hono } from 'hono'
import { serve } from '@hono/node-server';
import mongoose from 'mongoose';
import logger from './logger.js';
const { connect, connection, Schema, model } = mongoose;

const app = new Hono();
const port = 3004;

const dbUrl = 'mongodb://mongodb:27017/users';
connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const UserSchema = new Schema({
  name: String,
  email: String,
  registeredAt: { type: Date, default: Date.now }
});
const User = model('User', UserSchema);

// app.use(json());

app.get("/", async (c) => {
  logger.info("User Service is running");
  return c.json({ "Status": `User Service running on http://localhost:${port}` });
});

// Get a single user by ID
app.get('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    logger.info(`Fetching user with ID: ${id}`);
    const user = await User.findById(id);
    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }
    return c.json(user);
  } catch (error) {
    return c.json({ message: 'Internal server error', details: error.message }, 500);
  }
});

app.get('/users', async (c) => {
  logger.info("Fetching all users");
  const users = await User.find();
  return c.json(users);
});

app.get('/external/users', async (c) => {
  const externalUrl = 'http://hono-app:3000/users';
  try {
      const headers = Object.fromEntries(c.req.raw.headers.entries());
    logger.info({headers},`Calling external service at ${externalUrl}`);
    const response = await fetch(externalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from external service: ${response.statusText}`);
    }
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    logger.error("Error fetching external data", error);
    return c.json({ message: 'Failed to fetch external data', error: error.message }, 500);
  }
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  logger.info("users post request body", body);  // Log the incoming user data
  const newUser = new User(body);
  await newUser.save();
  return c.json(newUser, 201);
});

serve({ fetch: app.fetch, port });
console.log(`User Service running on http://localhost:${port}`);
