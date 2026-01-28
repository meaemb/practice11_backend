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
  PRACTICE 14
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
    message: "Shop API — Practice 9 to 13",
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

/*
  GET /api/products
*/
app.get("/api/products", async (req, res) => {
  try {
    const products = await productsCollection.find().toArray();
    res.json({
      count: products.length,
      products
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  GET /api/products/:id
*/
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const product = await productsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  POST /api/products
*/
app.post("/api/products", async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({
      error: "Missing fields: name, price, category"
    });
  }

  try {
    const newProduct = {
      name: name.trim(),
      price,
      category: category.trim(),
      createdAt: new Date()
    };

    const result = await productsCollection.insertOne(newProduct);

    res.status(201).json({
      message: "Product created",
      product: { _id: result.insertedId, ...newProduct }
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  PUT /api/products/:id
*/
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, category } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, price, category } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  DELETE /api/products/:id
*/
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const result = await productsCollection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   ITEMS (Practice 13)
   ========================= */

/*
  GET /api/items
*/
app.get("/api/items", async (req, res) => {
  try {
    const items = await itemsCollection.find().toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  GET /api/items/:id
*/
app.get("/api/items/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const item = await itemsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  POST /api/items
*/
app.post("/api/items", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const newItem = {
      name: name.trim(),
      createdAt: new Date()
    };

    const result = await itemsCollection.insertOne(newItem);

    res.status(201).json({
      message: "Item created",
      item: { _id: result.insertedId, ...newItem }
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  PUT /api/items/:id
*/
app.put("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: name.trim() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item fully updated" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  PATCH /api/items/:id
*/
app.patch("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (!name) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const result = await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: name.trim() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item partially updated" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  DELETE /api/items/:id
*/
app.delete("/api/items/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const result = await itemsCollection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  VERSION ENDPOINT — Practice Task 12
*/
app.get("/version", (req, res) => {
  res.json({
    version: "1.1",
    updatedAt: "2026-01-23"
  });
});

/*
  404 HANDLER
*/
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

/*
  START SERVER AFTER DB CONNECT
*/
async function start() {
  try {
    if (!MONGO_URL) {
      throw new Error("MONGO_URI is not defined");
    }

    const client = new MongoClient(MONGO_URL);
    await client.connect();

    const db = client.db(DB_NAME);
    productsCollection = db.collection(PRODUCTS_COLLECTION);
    itemsCollection = db.collection("items");

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
