# Payments Service

A microservice that handles payment processing and verification using Razorpay integration. It manages the complete payment lifecycle from order to payment confirmation in a ticket booking system.

## Overview

The Payments Service is responsible for:
- Creating payment orders via Razorpay
- Verifying payment signatures and transaction authenticity
- Tracking payment records in MongoDB
- Publishing payment completion events
- Syncing with order lifecycle events (creation, cancellation, expiration)

## How It Works

### Payment Flow

1. **User Creates Payment Request**
   - Client calls `POST /api/payments/` with an order ID
   - Service retrieves order from database
   - Creates a Razorpay order with the order amount

2. **Client Initiates Razorpay Checkout**
   - Frontend receives Razorpay order ID
   - User completes payment in Razorpay checkout

3. **Verify Payment**
   - Client calls `POST /api/payments/verify-payment` with payment details
   - Service validates the signature using HMAC-SHA256
   - Confirms transaction authenticity

4. **Event Synchronization**
   - Listens for `OrderCreated` → Stores order locally
   - Listens for `OrderCancelled` → Updates order status
   - Listens for `ExpirationComplete` → Updates order status
   - Publishes `PaymentCreated` event on successful payment

### Architecture

```
Client Request
     ↓
Express Routes (Auth Required)
     ↓
Order/Payment Models (MongoDB)
     ↓
Razorpay API
     ↓
NATS Event Bus
(OrderCreated, OrderCancelled, ExpirationComplete)
     ↓
PaymentCreated Event Publisher
```

## Prerequisites

- Node.js 18+
- MongoDB running and accessible
- NATS Streaming Server running
- Razorpay account with API credentials
- Environment variables configured

## Installation

```bash
npm install
```

## Environment Variables

```env
# JWT Authentication
JWT_KEY=your-jwt-secret-key

# MongoDB
MONGO_URI=mongodb://mongo-srv:27017/payments

# NATS Streaming
NATS_CLUSTER_ID=ticketing
NATS_CLIENT_ID=payments
NATS_URL=http://nats-srv:4222

# Razorpay
RAZOR_KEY_ID=your-razorpay-key-id
RAZOR_KEY=your-razorpay-key-secret

# Environment
NODE_ENV=production  # Use 'test' for testing, 'production' for secure cookies
```

## Running

### Development

Watch mode with automatic restart on file changes:

```bash
npm run dev
```

### Production

Build and run:

```bash
npm run build
npm start
```

### Testing

Run Jest test suite with watch mode:

```bash
npm test
```

## Docker

Build and run in Docker:

```bash
docker build -t payments-service .
docker run --env-file .env payments-service
```

See `k8s/` directory for Kubernetes deployment manifests.

## API Endpoints

### Create Payment Order

**POST** `/api/payments/`

Creates a new payment order via Razorpay.

**Headers:**
- `Authorization`: JWT token (required)

**Request Body:**
```json
{
  "orderId": "order_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_razorpay_id",
    "entity": "order",
    "amount": 10000,
    "amount_paid": 0,
    "amount_due": 10000,
    "currency": "INR",
    "status": "created",
    "created_at": 1704067200
  }
}
```

**Errors:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Order not found
- `401 Not Authorized` - User not authorized for this order
- `400 Bad Request` - Order is cancelled

### Verify Payment

**POST** `/api/payments/verify-payment`

Verifies payment signature and confirms transaction authenticity.

**Headers:**
- `Authorization`: JWT token (required)

**Request Body:**
```json
{
  "orderId": "order_id",
  "razorpay_order_id": "order_razorpay_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified"
}
```

**Errors:**
- `400 Bad Request` - Invalid payment signature
- `500 Internal Server Error` - Server error during verification

## Events

### Subscribed Events

- **OrderCreated**
  - Stores order in local MongoDB
  - Fields: `id`, `userId`, `version`, `price`, `status`

- **OrderCancelled**
  - Updates order status to cancelled
  - Prevents further payment attempts

- **ExpirationComplete**
  - Updates order status to expired

### Published Events

- **PaymentCreated**
  - `orderId`: ID of the order
  - `id`: Razorpay order ID
  - `paymentId`: MongoDB payment record ID
  - Published when payment order is successfully created

## Data Models

### Order

```typescript
{
  _id: string,              // MongoDB ID (same as order ID)
  userId: string,           // Owner of the order
  price: number,            // Order amount in INR (paise)
  status: OrderStatus,      // Created, AwaitingPayment, Completed, Cancelled
  version: number           // Optimistic concurrency control
}
```

### Payment

```typescript
{
  _id: ObjectId,            // MongoDB ID
  orderId: string,          // Associated order ID
  orderInfo: {              // Razorpay order details
    id: string,
    entity: string,
    amount: number,
    amount_paid: number,
    amount_due: number,
    currency: string,
    status: string,
    created_at: number
  },
  version: number           // Optimistic concurrency control
}
```

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Payment Gateway**: Razorpay
- **Event Bus**: NATS Streaming
- **Authentication**: JWT with Cookie Session
- **Security**: HMAC-SHA256 signature verification
- **Testing**: Jest with ts-jest
- **Development**: Nodemon, ts-node

## Project Structure

```
payments/
├── src/
│   ├── index.ts                              # Entry point and startup
│   ├── app.ts                                # Express app configuration
│   ├── nats-class-wrapper.ts                 # NATS client wrapper
│   ├── razor.ts                              # Razorpay client initialization
│   ├── controller/
│   │   └── verifysignature.ts                # Signature verification logic
│   ├── models/
│   │   ├── order.ts                          # Order schema and model
│   │   └── payments.ts                       # Payment schema and model
│   ├── events/
│   │   ├── listeners/
│   │   │   ├── order-created-listener.ts     # OrderCreated event handler
│   │   │   ├── order-cancelled-listener.ts   # OrderCancelled event handler
│   │   │   ├── expiration-complete-listener.ts # ExpirationComplete handler
│   │   │   └── queue-group-listener.ts       # Queue group configuration
│   │   └── publishers/
│   │       └── payment-created-publisher.ts  # PaymentCreated event publisher
│   └── routes/
│       ├── new.ts                            # POST /api/payments/
│       └── verify-payment.ts                 # POST /api/payments/verify-payment
├── k8s/                                      # Kubernetes manifests
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Key Features

- **Razorpay Integration**: Seamless payment processing with Razorpay
- **Signature Verification**: HMAC-SHA256 based secure payment verification
- **Event-Driven**: Full event synchronization across microservices
- **Authentication**: JWT-based user authentication and authorization
- **Optimistic Concurrency**: Version-based conflict detection and resolution
- **Error Handling**: Comprehensive error handling with standardized error responses
- **Containerized**: Docker and Kubernetes ready

## Development Notes

- The service validates that the user is authorized for the order before processing payments
- Payment verification uses HMAC-SHA256 with Razorpay secret key
- Orders are stored locally to track payment state and history
- The service trusts proxy headers from ingress-nginx
- Cookies are secure only in non-test environments
- Mongoose `updateIfCurrentPlugin` provides optimistic concurrency control

## Security Considerations

- JWT tokens stored in signed HTTP-only cookies
- Razorpay signature verification prevents tampering
- User authorization checks on all payment operations
- Order status validation before payment processing
- HTTPS enforced in production (via proxy)

## Contributing

Follow the existing code patterns and ensure all tests pass before committing.

## License

ISC
