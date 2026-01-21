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
  res.send(`
    <h1>Shop API — Practice 9, 10 & 11</h1>

    <h3>Basic queries</h3>
    <ul>
      <li><a href="/api/products" target="_blank">GET /api/products</a></li>
    </ul>

    <h3>Filtering</h3>
    <ul>
      <li>
        <a href="/api/products?category=Electronics" target="_blank">
          /api/products?category=Electronics
        </a>
      </li>
      <li>
        <a href="/api/products?minPrice=100&sort=price" target="_blank">
          /api/products?minPrice=100&sort=price
        </a>
      </li>
    </ul>

    <h3>Projection</h3>
    <ul>
      <li>
        <a href="/api/products?fields=name,price" target="_blank">
          /api/products?fields=name,price
        </a>
      </li>
    </ul>

    <p><b>Note:</b> All data is fetched from MongoDB using environment variables.</p>
  `);
});

/*
  5) GET /api/products
  Practice 9 + 10
*/
app.get("/api/products", async (req, res) => {
  try {
    const { category, minPrice, sort, fields } = req.query;

    // FILTER
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (minPrice) {
      filter.price = { $gte: Number(minPrice) };
    }

    // SORT
    let sortOption = {};
    if (sort === "price") {
      sortOption.price = 1;
    }

    // PROJECTION
    let projection = {};
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
  Practice 9 + 11
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

  if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
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
      id: result.insertedId,
      product: { _id: result.insertedId, ...newProduct }
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

/*
  8) DELETE /api/products/:id
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
  9) 404 HANDLER
*/
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

/*
  10) START SERVER AFTER DB CONNECT
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
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
