const request = require("supertest");
const app = require("../../app");
const { initTestDB, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("API Integration: System Health, Diagnostics & Observability", () => {
    beforeAll(async () => {
        await initTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    test("GET /health should return 200 with diagnostics & database status", async () => {
        const res = await request(app).get("/health");
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe("healthy");
        expect(res.body.database.status).toBe("connected");
        if (res.body.memory) {
            expect(res.body.memory.heapUsedMB).toBeGreaterThan(0);
        }
    });

    test("GET /api/v1/health should mirror root health endpoint", async () => {
        const res = await request(app).get("/api/v1/health");
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe("healthy");
    });

    test("GET /api-docs should serve Swagger OpenAPI documentation UI", async () => {
        const res = await request(app).get("/api-docs");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("SwaggerUIBundle");
    });

    test("Request logger middleware should attach X-Request-Id header to responses", async () => {
        const res = await request(app).get("/health");
        expect(res.headers["x-request-id"]).toBeDefined();
    });

    test("GET non-existent route should return 404 JSON error response", async () => {
        const res = await request(app).get("/api/v1/non-existent-route-404");
        expect(res.statusCode).toBe(404);
        expect(res.body.status).toBe(false);
    });
});
