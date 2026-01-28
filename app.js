// 0) Load environment variables
require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

/*
  1) ENVIRONMENT VARIABLES
*/
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI;

/*
  2) MIDDLEWARES
*/
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(express.json());

/*
  PRACTICE 14 — API KEY MIDDLEWARE
*/
function checkApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "API key is missing" });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
}

/*
  3) MONGODB CONFIG
*/
const DB_NAME = "shop";
const PRODUCTS_COLLECTION = "products";

let productsCollection;
let itemsCollection;

/*
  4) HOME ROUTE
*/
app.get("/", (req, res) => {
  res.json({
    message: "Shop API — Practice 9 to 14",
    endpoints: {
      products: "/api/products",
      items: "/api/items",
      version: "/version"
    }
  });
});

/* =========================
   PRODUCTS (Practice 9–11)
   ========================= */

app.get("/api/products", async (req, res) => {
  try {
    const products = await productsCollection.find().toArray();
    res.json({ count: products.length, products });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const product = await productsCollection.findOne({
    _id: new ObjectId(req.params.id)
  });

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
});

app.post("/api/products", async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const result = await productsCollection.insertOne({
    name: name.trim(),
    price,
    category: category.trim(),
    createdAt: new Date()
  });

  res.status(201).json({ _id: result.insertedId });
});

/* =========================
   ITEMS (Practice 13–14)
   ========================= */

app.get("/api/items", async (req, res) => {
  const items = await itemsCollection.find().toArray();
  res.json(items);
});

app.get("/api/items/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const item = await itemsCollection.findOne({
    _id: new ObjectId(req.params.id)
  });

  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  res.json(item);
});

/* PROTECTED ENDPOINTS (Practice 14) */

app.post("/api/items", checkApiKey, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const result = await itemsCollection.insertOne({
    name: name.trim(),
    createdAt: new Date()
  });

  res.status(201).json({ _id: result.insertedId });
});

app.put("/api/items/:id", checkApiKey, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const result = await itemsCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { name: req.body.name } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Item not found" });
  }

  res.json({ message: "Item fully updated" });
});

app.patch("/api/items/:id", checkApiKey, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const result = await itemsCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Item not found" });
  }

  res.json({ message: "Item partially updated" });
});

app.delete("/api/items/:id", checkApiKey, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  await itemsCollection.deleteOne({
    _id: new ObjectId(req.params.id)
  });

  res.status(204).send();
});

/*
  PRACTICE 12 — VERSION
*/
app.get("/version", (req, res) => {
  res.json({ version: "1.1", updatedAt: "2026-01-23" });
});

/*
  START SERVER
*/
async function start() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  const db = client.db(DB_NAME);
  productsCollection = db.collection(PRODUCTS_COLLECTION);
  itemsCollection = db.collection("items");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
