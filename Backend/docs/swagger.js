const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "PulseTrade Paper-Trading API",
        version: "1.0.0",
        description: "RESTful API & WebSocket engine for simulated paper-trading, portfolio management, atomic order execution, and Razorpay sandbox payments.",
        contact: {
            name: "PulseTrade Engineering Team",
            url: "https://github.com/Sekhar01807/Trading-platform"
        }
    },
    servers: [
        {
            url: "/api/v1",
            description: "Version 1 API (Primary)"
        },
        {
            url: "/",
            description: "Root API (Legacy Aliases)"
        }
    ],
    components: {
        securitySchemes: {
            cookieAuth: {
                type: "apiKey",
                in: "cookie",
                name: "token",
                description: "HTTP-only secure session cookie containing signed JWT"
            },
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            User: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    email: { type: "string", format: "email" },
                    funds: { type: "number" }
                }
            },
            Order: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    name: { type: "string", example: "INFY" },
                    qty: { type: "integer", example: 2 },
                    price: { type: "number", example: 1555.45 },
                    mode: { type: "string", enum: ["BUY", "SELL"] },
                    status: { type: "string", enum: ["PENDING", "EXECUTED", "REJECTED", "CANCELLED"] },
                    totalCost: { type: "number", example: 3110.90 },
                    createdAt: { type: "string", format: "date-time" }
                }
            },
            Holding: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    name: { type: "string" },
                    qty: { type: "integer" },
                    avg: { type: "number", description: "Weighted average purchase cost basis" },
                    price: { type: "number", description: "Current market price (LTP)" },
                    net: { type: "string" },
                    day: { type: "string" },
                    isLoss: { type: "boolean" }
                }
            },
            Transaction: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    type: { type: "string", enum: ["DEPOSIT", "WITHDRAWAL", "ORDER_BUY", "ORDER_SELL"] },
                    amount: { type: "number" },
                    balanceBefore: { type: "number" },
                    balanceAfter: { type: "number" },
                    referenceId: { type: "string" },
                    description: { type: "string" },
                    createdAt: { type: "string", format: "date-time" }
                }
            }
        }
    },
    paths: {
        "/health": {
            get: {
                summary: "Service Health & System Diagnostics",
                tags: ["System"],
                responses: {
                    200: { description: "Service healthy and DB connected" },
                    503: { description: "Service degraded / DB disconnected" }
                }
            }
        },
        "/auth/signup": {
            post: {
                summary: "Register new user account",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "email", "password"],
                                properties: {
                                    username: { type: "string" },
                                    email: { type: "string", format: "email" },
                                    password: { type: "string", minLength: 8 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "User registered successfully (Sets HttpOnly cookie)" },
                    400: { description: "Validation error" }
                }
            }
        },
        "/auth/login": {
            post: {
                summary: "Authenticate user and issue session cookie",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string" },
                                    password: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Logged in successfully" },
                    400: { description: "Invalid credentials" }
                }
            }
        },
        "/auth/logout": {
            post: {
                summary: "Log out user and clear auth cookie",
                tags: ["Authentication"],
                responses: {
                    200: { description: "Cookie cleared" }
                }
            }
        },
        "/orders/allOrders": {
            get: {
                summary: "Retrieve user orders with pagination & filters",
                tags: ["Orders"],
                security: [{ cookieAuth: [] }],
                parameters: [
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
                    { name: "status", in: "query", schema: { type: "string", enum: ["ALL", "EXECUTED", "REJECTED", "CANCELLED"] } },
                    { name: "mode", in: "query", schema: { type: "string", enum: ["ALL", "BUY", "SELL"] } },
                    { name: "symbol", in: "query", schema: { type: "string" } },
                    { name: "sortBy", in: "query", schema: { type: "string", default: "createdAt" } },
                    { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } }
                ],
                responses: {
                    200: { description: "List of orders with pagination metadata" },
                    401: { description: "Unauthorized" }
                }
            }
        },
        "/orders/newOrders": {
            post: {
                summary: "Submit transaction-safe BUY or SELL stock order",
                tags: ["Orders"],
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "qty", "price", "mode"],
                                properties: {
                                    name: { type: "string", example: "INFY" },
                                    qty: { type: "integer", example: 2 },
                                    price: { type: "number", example: 1555.45 },
                                    mode: { type: "string", enum: ["BUY", "SELL"] }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "Order executed successfully" },
                    400: { description: "Order rejected (insufficient funds or insufficient shares)" },
                    401: { description: "Unauthorized" }
                }
            }
        },
        "/holdings/allHoldings": {
            get: {
                summary: "Retrieve user stock holdings",
                tags: ["Holdings & Positions"],
                security: [{ cookieAuth: [] }],
                responses: {
                    200: { description: "List of holdings" },
                    401: { description: "Unauthorized" }
                }
            }
        },
        "/wallet/user/funds": {
            get: {
                summary: "Retrieve financial wallet summary & available cash",
                tags: ["Wallet & Payments"],
                security: [{ cookieAuth: [] }],
                responses: {
                    200: { description: "Wallet balance & margins" },
                    401: { description: "Unauthorized" }
                }
            },
            post: {
                summary: "Add or withdraw funds from wallet",
                tags: ["Wallet & Payments"],
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["amount", "action"],
                                properties: {
                                    amount: { type: "number" },
                                    action: { type: "string", enum: ["ADD", "WITHDRAW"] }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Funds updated successfully" },
                    400: { description: "Invalid amount or insufficient cash for withdrawal" },
                    401: { description: "Unauthorized" }
                }
            }
        },
        "/wallet/create-razorpay-order": {
            post: {
                summary: "Create Razorpay test order for wallet deposit",
                tags: ["Wallet & Payments"],
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["amount"],
                                properties: { amount: { type: "number" } }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Razorpay order created" }
                }
            }
        },
        "/wallet/verify-razorpay-payment": {
            post: {
                summary: "Verify Razorpay payment signature (HMAC-SHA256) with idempotency",
                tags: ["Wallet & Payments"],
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["amount", "razorpay_payment_id", "razorpay_order_id", "razorpay_signature"],
                                properties: {
                                    amount: { type: "number" },
                                    razorpay_payment_id: { type: "string" },
                                    razorpay_order_id: { type: "string" },
                                    razorpay_signature: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Payment verified and credited" },
                    400: { description: "Signature verification failed" }
                }
            }
        },
        "/wallet/user/transactions": {
            get: {
                summary: "Retrieve user wallet transaction audit ledger",
                tags: ["Wallet & Payments"],
                security: [{ cookieAuth: [] }],
                responses: {
                    200: { description: "Transaction history list" }
                }
            }
        }
    }
};

const renderSwaggerHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PulseTrade API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" />
    <style>
        body { margin: 0; padding: 0; background: #0f172a; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/api-docs.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout"
            });
        };
    </script>
</body>
</html>
`;

module.exports = { openApiSpec, renderSwaggerHTML };
