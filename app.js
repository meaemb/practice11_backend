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
  3) MONGODB CONFIG
*/
const DB_NAME = "shop";
const COLLECTION_NAME = "products";

let productsCollection;

/*
  4) HOME ROUTE
*/
app.get("/", (req, res) => {
  res.json({
    message: "Shop API — Practice 9, 10 & 11",
    endpoints: {
      getAll: "GET /api/products",
      getOne: "GET /api/products/:id",
      create: "POST /api/products",
      update: "PUT /api/products/:id",
      delete: "DELETE /api/products/:id"
    }
  });
});

/*
  5) GET /api/products
  Filtering, sorting, projection
*/
app.get("/api/products", async (req, res) => {
  try {
    const { category, minPrice, sort, fields } = req.query;

    // FILTER
    const filter = {};
    if (category) filter.category = category;
    if (minPrice) filter.price = { $gte: Number(minPrice) };

    // SORT
    const sortOption = {};
    if (sort === "price") sortOption.price = 1;

    // PROJECTION
    const projection = {};
    if (fields) {
      fields.split(",").forEach(field => {
        projection[field] = 1;
      });
    }

    const products = await productsCollection
      .find(filter, { projection })
      .sort(sortOption)
      .toArray();

    res.json({
      count: products.length,
      products
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  6) GET /api/products/:id
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
  7) POST /api/products
*/
app.post("/api/products", async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({
      error: "Missing fields: name, price, category"
    });
  }

  if (typeof name !== "string" || typeof category !== "string") {
    return res.status(400).json({
      error: "name and category must be strings"
    });
  }

  if (typeof price !== "number" || price < 0) {
    return res.status(400).json({
      error: "price must be a non-negative number"
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
  8) PUT /api/products/:id
*/
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, category } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (!name && price === undefined && !category) {
    return res.status(400).json({
      error: "At least one field must be provided"
    });
  }

  const updateData = {};

  if (name) {
    if (typeof name !== "string") {
      return res.status(400).json({ error: "name must be a string" });
    }
    updateData.name = name.trim();
  }

  if (category) {
    if (typeof category !== "string") {
      return res.status(400).json({ error: "category must be a string" });
    }
    updateData.category = category.trim();
  }

  if (price !== undefined) {
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "price must be a non-negative number" });
    }
    updateData.price = price;
  }

  try {
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
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
  9) DELETE /api/products/:id
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
  10) 404 HANDLER
*/
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

/*
  11) START SERVER AFTER DB CONNECT
*/
async function start() {
  try {
    if (!MONGO_URL) {
      throw new Error("MONGO_URI is not defined");
    }

    const client = new MongoClient(MONGO_URL);
    await client.connect();

    const db = client.db(DB_NAME);
    productsCollection = db.collection(COLLECTION_NAME);

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
