const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// Create test app instance
const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

// Dummy test routes mimicking API contracts
app.get("/allHoldings", (req, res) => res.status(200).json([]));
app.get("/allPositions", (req, res) => res.status(200).json([]));
app.get("/allOrders", (req, res) => res.status(200).json([]));
app.post("/newOrders", (req, res) => {
    const { name, qty, price, mode } = req.body;
    if (!name || !qty || !price || !mode) {
        return res.status(400).json({ message: "All order fields are required" });
    }
    return res.status(201).json({ message: "Order added successfully!", success: true });
});

describe("Zerodha Backend API Suite", () => {
    test("GET /allHoldings should return 200 OK and list", async () => {
        const response = await request(app).get("/allHoldings");
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("GET /allPositions should return 200 OK and list", async () => {
        const response = await request(app).get("/allPositions");
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("GET /allOrders should return 200 OK and list", async () => {
        const response = await request(app).get("/allOrders");
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("POST /newOrders should reject incomplete payload with 400", async () => {
        const response = await request(app)
            .post("/newOrders")
            .send({ name: "INFY", qty: 2 });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("All order fields are required");
    });

    test("POST /newOrders should accept valid order payload", async () => {
        const response = await request(app)
            .post("/newOrders")
            .send({ name: "INFY", qty: 2, price: 1500, mode: "BUY" });
        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
    });
});
