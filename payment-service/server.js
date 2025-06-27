// import express, { json } from 'express';
// import "./telemetry.js"
import { Hono } from 'hono'
import { serve } from '@hono/node-server';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import logger from './logger.js';
const { connect, Schema, model } = mongoose;

const app = new Hono();
const port = 3002;

const dbUrl = 'mongodb://mongodb:27017/payments';
connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const PaymentSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    amount: Number,
    paymentDate: { type: Date, default: Date.now }
});

const Payment = model('Payment', PaymentSchema);

// app.use(json());

app.get("/", async (c) => {
    logger.info("Payment Service is running");
    return c.json({ "Status": `Payment Service running on http://localhost:${port}` });
});

app.get('/payments', async (c) => {
    logger.info("Fetching all payments");
    const payments = await Payment.find();
    return c.json(payments);
});

app.post('/payments', async (c) => {
    try {
        const { orderId, amount } = await c.req.json();

        const order = await fetch(`http://order:3001/orders/${orderId}`).then(res => res.json());
        console.log(order);
        if (!order || order.status !== 'awaiting payment') {
            return c.json({ error: 'Invalid order ID or order not ready for payment' }, 400);
        }

        const newPayment = new Payment({ orderId, amount });
        await newPayment.save();

        await fetch(`http://order:3001/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'paid' })
        });

        return c.json(newPayment, 201);
    } catch (error) {
        return c.json({ error: 'Internal server error', details: error.message }, 500);
    }
});

serve({ fetch: app.fetch, port });
console.info(`Payment Service running on http://localhost:${port}`);
