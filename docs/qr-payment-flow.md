# QR Code Shop Registration and Payment Flow (Demo Version)

## Overview

This document describes the implementation of the QR Code Shop Registration and Payment Flow for demonstration purposes. The system allows admins to create shops with unique QR codes that customers can scan to simulate payment transactions.

## Features Implemented

### 1. Shop Registration (Admin)

**Endpoint**: `POST /api/shops`

**Required Fields**:
- `shopName`: Name of the shop
- `gstNumber`: Valid GST number (format: 27AAAAA0000A1Z5)
- `mobileNumber`: 10-digit mobile number

**Optional Fields**:
- `ownerName`: Name of the shop owner
- `contactInfo`: Additional contact details
- `address`: Shop address
- `assignOwner`: Assign existing user as shop owner
- `demoTransactionAmount`: Fixed amount for demo transactions (default: ₹30)

**Response**:
- Shop data with unique QR code
- QR code contains shop-specific details and demo amount

### 2. QR Code Generation

Each shop gets a unique QR code containing:
```json
{
  "shopId": "mongodb_object_id",
  "shopName": "Shop Name",
  "shopCode": "SHOP_1234567890_ABC123DEF",
  "qrId": "uuid_v4",
  "type": "shop_payment_demo",
  "demoAmount": 30,
  "gstNumber": "27AAAAA0000A1Z5",
  "mobileNumber": "9876543210"
}
```

### 3. QR Code Scanning Simulation

**Endpoint**: `POST /api/transactions/simulate-qr-scan`

**Request Body**:
```json
{
  "shopId": "shop_id_or_null",
  "shopCode": "SHOP_1234567890_ABC123DEF",
  "paymentMethod": "googlepay|phonepe|paytm|upi|demo",
  "customerInfo": {
    "name": "Customer Name",
    "phone": "9876543210",
    "upiId": "customer@paytm"
  }
}
```

**Response**:
```json
{
  "message": "QR scan simulated successfully",
  "transaction": {
    "id": "transaction_id",
    "transactionId": "TXN_1234567890_ABC123",
    "amount": 30,
    "shop": {
      "id": "shop_id",
      "name": "Shop Name",
      "gstNumber": "27AAAAA0000A1Z5",
      "mobileNumber": "9876543210"
    },
    "status": "simulated",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Transaction Logging

All QR scan simulations are logged in the `transactions` collection with:
- Shop ID and Shop Code
- Transaction Amount (fixed demo amount)
- Timestamp
- Payment Method (GooglePay, PhonePe, Paytm, etc.)
- Customer Information
- Transaction Status (simulated for demo)

### 5. Dashboard Access

#### Shop Owner Dashboard
**Endpoint**: `GET /api/shops/:id/dashboard`

Provides:
- Recent demo transactions
- Today's transaction statistics
- Monthly transaction statistics
- Shop QR code details

#### Admin Dashboard
**Endpoint**: `GET /api/transactions`

Provides:
- All transactions across all shops
- Transaction analytics
- Shop-wise performance

## API Endpoints

### Shop Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/shops` | Create new shop | Admin |
| GET | `/api/shops` | Get all shops | Admin |
| GET | `/api/shops/:id` | Get single shop | Admin/Owner |
| PUT | `/api/shops/:id` | Update shop | Admin |
| DELETE | `/api/shops/:id` | Delete shop | Admin |
| POST | `/api/shops/:id/regenerate-qr` | Regenerate QR code | Admin |

### QR Code Access

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/shops/qr/:qrId` | Get shop by QR ID | Public |
| GET | `/api/shops/code/:shopCode` | Get shop by shop code | Public |

### Transaction Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/transactions/simulate-qr-scan` | Simulate QR scan | Public |
| GET | `/api/transactions` | Get all transactions | Admin |
| GET | `/api/transactions/shop/:shopId` | Get shop transactions | Admin/Owner |
| GET | `/api/transactions/analytics` | Get transaction analytics | Admin |
| GET | `/api/transactions/:id` | Get single transaction | Admin/Owner |

## Database Models

### Shop Model
```javascript
{
  shopName: String (required),
  gstNumber: String (required, unique),
  mobileNumber: String (required, unique),
  ownerName: String,
  contactInfo: { phone, email },
  address: { street, city, state, zipCode, country },
  paymentQR: {
    qrCode: String (base64 image),
    qrData: String (JSON),
    qrId: String (unique),
    shopCode: String (unique)
  },
  shopOwner: ObjectId (User),
  isActive: Boolean,
  totalRevenue: Number,
  totalPurchases: Number,
  demoTransactionAmount: Number,
  createdBy: ObjectId (User)
}
```

### Transaction Model
```javascript
{
  shop: ObjectId (Shop),
  shopCode: String,
  transactionAmount: Number,
  transactionType: String,
  paymentMethod: String,
  transactionId: String (unique),
  status: String,
  customerInfo: { name, phone, upiId },
  metadata: { scannedAt, userAgent, ipAddress, qrId },
  notes: String
}
```

## Usage Examples

### 1. Create a Shop (Admin)
```bash
curl -X POST http://localhost:5000/api/shops \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopName": "Electronics Paradise",
    "gstNumber": "27AAAAA0000A1Z5",
    "mobileNumber": "9876543210",
    "ownerName": "John Doe",
    "demoTransactionAmount": 50,
    "contactInfo": {
      "email": "shop@example.com"
    },
    "address": {
      "street": "123 Market Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001"
    }
  }'
```

### 2. Simulate QR Scan
```bash
curl -X POST http://localhost:5000/api/transactions/simulate-qr-scan \
  -H "Content-Type: application/json" \
  -d '{
    "shopCode": "SHOP_1234567890_ABC123DEF",
    "paymentMethod": "googlepay",
    "customerInfo": {
      "name": "Customer Name",
      "phone": "9876543210",
      "upiId": "customer@paytm"
    }
  }'
```

### 3. Get Shop by QR Code
```bash
curl -X GET http://localhost:5000/api/shops/qr/QR_ID_HERE
```

### 4. View Shop Dashboard
```bash
curl -X GET http://localhost:5000/api/shops/SHOP_ID/dashboard \
  -H "Authorization: Bearer SHOP_OWNER_TOKEN"
```

## Security Features

1. **Unique QR Codes**: Each shop has a unique QR code that can be regenerated
2. **Access Control**: Shop owners can only view their own shop data
3. **Validation**: GST number and mobile number validation
4. **Duplicate Prevention**: Prevents duplicate GST numbers and mobile numbers

## Demo Constraints

1. **Fixed Transaction Amount**: Each shop has a fixed demo transaction amount
2. **Simulated Status**: All transactions are marked as "simulated"
3. **No Real Payment**: No actual payment gateway integration
4. **Mock Customer Data**: Customer information is optional and for demo purposes

## Future Enhancements

1. **Real Payment Integration**: Add UPI/Razorpay/Paytm API integration
2. **Dynamic Amounts**: Allow variable transaction amounts
3. **Customer Authentication**: Add customer login and transaction history
4. **Receipt Generation**: Generate digital receipts for transactions
5. **Notification System**: SMS/Email notifications for transactions

## Testing

Use the seed data script to create sample shops and transactions:
```bash
npm run seed
```

This creates:
- 3 sample shops with unique QR codes
- 4 demo transactions
- Test accounts for different user roles