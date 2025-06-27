// import "./telemetry.js";
import { Hono } from 'hono'
import { serve } from '@hono/node-server';
import fetch from "node-fetch";
import mongoose from "mongoose";
import { performance } from "perf_hooks";
import logger from "./logger.js";
const { connect, Schema, model } = mongoose;
import { trace, metrics, SpanStatusCode } from "@opentelemetry/api";
import  externalHandler  from "./handler/handler.js"
import {responseTimeMiddleware} from "./middleware/metricsMiddleware.js"
const tracer = trace.getTracer("order-service");
const meter = metrics.getMeter("order-service");
import externaHandler from "./handlers/handlers.js"

const app = new Hono();
const port = 3001;

const dbUrl = "mongodb://mongodb:27017/orders";
connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  products: [{ productId: Schema.Types.ObjectId, quantity: Number }],
  orderDate: { type: Date, default: Date.now },
  status: {
    type: String,
    default: "awaiting payment",
    enum: ["awaiting payment", "paid", "cancelled", "shipped", "completed"],
  },
});

const Order = model("Order", OrderSchema);
app.use("*",responseTimeMiddleware)

app.get("/", async (c) => {
  logger.info("Order Service is running");
  return c.json({ Status: `Order Service running on http://localhost:${port}` });
});

app.get("/orders", async (c) => {
  logger.info("Fetching all orders");
  const orders = await Order.find();
  const ordersWithUserDetails = await Promise.all(
    orders.map(async (order) => {
      const userResponse = await fetch(`http://user:3004/users/${order.userId}`);
      const user = await userResponse.json();
      return { ...order.toObject(), user };
    })
  );
  return c.json(ordersWithUserDetails);
});

app.post("/orders", async (c) => {
  try {
    const body = await c.req.json();
    const order = new Order(body);
    await validateOrder(order);
    await order.save();
    logger.info({ orderId: order._id.toString() }, "Order created successfully");
    return c.json(order, 201);
  } catch (error) {
    logger.error({ error: error.message }, "Error creating order");
    return c.json({ message: error.message }, 500);
  }
});



app.get("/orders/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const order = await Order.findById(id);
    if (!order) {
      logger.warn({ orderId: id }, "Order not found");
      return c.json({ message: "Order not found" }, 404);
    }

    const userResponse = await fetch(`http://user:3004/users/${order.userId}`);
    if (!userResponse.ok) {
      logger.error({ orderId: id, userId: order.userId }, "Failed to fetch user details");
      throw new Error(`Failed to fetch user with ID ${order.userId}`);
    }
    const user = await userResponse.json();

    const detailedOrder = {
      ...order.toObject(),
      user: user,
    };
    logger.info({ orderId: id }, "Fetched order details successfully");
    return c.json(detailedOrder);
  } catch (error) {
    return c.json({ error: "Internal server error", details: error.message }, 500);
  }
});

app.patch("/orders/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return c.json({ message: "Order not found" }, 404);
    }

    return c.json(order);
  } catch (error) {
    return c.json({ message: "Internal server error", details: error.message }, 500);
  }
});

app.get('/external', externalHandler);

serve({ fetch: app.fetch, port });
logger.info(`Order Service running on http://localhost:${port}`);

const orderValidationDurationHistogram = meter.createHistogram(
  "order_validation_duration",
  {
    description: "Measures the duration of order validation",
    unit: "ms",
  }
);

async function validateOrder(order) {
  const startTime = performance.now();
  logger.info({ orderId: order._id.toString() }, "Starting order validation");


  return tracer.startActiveSpan("validate-order", async (span) => {
    try {
      span.addEvent("Order validation started");
      span.setAttribute("order.id", order._id.toString());

      let total = 0;

      for (const item of order.products) {
        logger.info(
          {
            orderId: order._id.toString(),
            productId: item.productId,
            quantity: item.quantity,
          },
          "Checking product availability"
        );

        const productResponse = await fetch(
          `http://product:3003/products/${item.productId}`
        );
        const product = await productResponse.json();

        if (!product || product.stock < item.quantity) {
          logger.error(
            {
              orderId: order._id.toString(),
              productId: item.productId,
              required: item.quantity,
              available: product ? product.stock : "N/A",
            },
            "Product is out of stock or does not exist"
          );
          throw new Error(
            `Product ${item.productId} is out of stock or does not exist.`
          );
        }

        const updateResponse = await fetch(
          `http://product:3003/products/${item.productId}/decrement-stock`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decrementBy: item.quantity }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error(
            `Failed to update stock for Product ${item.productId}.`
          );
        }

        total += product.price * item.quantity;
      }

      span.setAttribute("order.total", total);
      span.addEvent("Order validation completed");

      const duration = performance.now() - startTime;

      orderValidationDurationHistogram.record(duration, {
        "order.id": order._id.toString(),
        status: "validated",
      });

      span.setStatus({ code: SpanStatusCode.OK });

      logger.info(
        { orderId: order._id.toString(), duration },
        "Order validation completed successfully"
      );
    } catch (error) {
      logger.error(
        { orderId: order._id.toString(), error: error.message },
        "Order validation failed"
      );
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
