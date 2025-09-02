# Shopping App Backend

A complete Node.js backend for a shopping application with role-based access control, featuring user management, product catalog, orders, and favorites functionality.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Support for Users, Shop Owners, Electricians, and Admins
- **Product Catalog**: Full CRUD with categories, images, ratings, and search
- **Order Management**: Complete order lifecycle with stock management
- **Favorites**: User can save favorite products
- **File Uploads**: Image upload with validation and storage
- **Security**: Rate limiting, CORS, input validation, and password hashing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/shopping-app
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@shopping.com
   ADMIN_PASSWORD=admin123
   ADMIN_NAME=System Administrator
   ```

3. **Seed the database** (optional but recommended for testing):
   ```bash
   npm run seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### 1. User Signup
```bash
POST /api/auth/signup/user

curl -X POST http://localhost:5000/api/auth/signup/user \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "password": "password123",
    "confirmPassword": "password123",
    "referral": "FRIEND123"
  }'
```

#### 2. Shop Owner Signup
```bash
POST /api/auth/signup/shopowner

curl -X POST http://localhost:5000/api/auth/signup/shopowner \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shop Owner",
    "phone": "9876543211",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "shopowner",
    "gstNumber": "22AAAAA0000A1Z5",
    "shopName": "Electronics Paradise"
  }'
```

#### 3. Login
```bash
POST /api/auth/login

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "password123"
  }'
```

#### 4. Get Profile
```bash
GET /api/auth/profile

curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
#### 5.Get All Users (Admin only, requires token)

GET /api/auth/users
curl -X GET http://localhost:5006/api/auth/users \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"


### Categories

#### 5. Get All Categories
```bash
GET /api/categories

curl -X GET http://localhost:5000/api/categories
```

#### 6. Create Category (Admin only)
```bash
POST /api/categories

curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Smart Home",
    "description": "Smart home automation products"
  }'
```

### Products

#### 7. Get All Products
```bash
GET /api/products?page=1&limit=10&category=CATEGORY_ID&search=LED&minPrice=100&maxPrice=1000

curl -X GET "http://localhost:5000/api/products?page=1&limit=10"
```

#### 8. Get Single Product
```bash
GET /api/products/:id

curl -X GET http://localhost:5000/api/products/PRODUCT_ID
```

#### 9. Create Product (Shop Owner/Admin only)
```bash
POST /api/products

curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=LED Bulb 12W" \
  -F "description=Energy efficient LED bulb" \
  -F "aboutProduct=Detailed product information..." \
  -F "price=200" \
  -F "stock=50" \
  -F "category=CATEGORY_ID" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

#### 10. Rate Product
```bash
POST /api/products/:id/rate

curl -X POST http://localhost:5000/api/products/PRODUCT_ID/rate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5
  }'
```

### Orders

#### 11. Place Order
```bash
POST /api/orders

curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product": "PRODUCT_ID",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001"
    },
    "paymentMethod": "cod",
    "notes": "Please deliver in the evening"
  }'
```

#### 12. Get User Orders
```bash
GET /api/orders/my-orders

curl -X GET http://localhost:5000/api/orders/my-orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 13. Get All Orders (Admin only)
```bash
GET /api/orders

curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

#### 14. Update Order Status (Admin only)
```bash
PUT /api/orders/:id/status

curl -X PUT http://localhost:5000/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

### Favorites

#### 15. Toggle Favorite
```bash
POST /api/favorites/toggle/:productId

curl -X POST http://localhost:5000/api/favorites/toggle/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 16. Get User Favorites
```bash
GET /api/favorites

curl -X GET http://localhost:5000/api/favorites \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## User Roles

- **User**: Can browse products, place orders, manage favorites
- **Shop Owner**: Can create and manage products, plus all user permissions
- **Electrician**: Same as shop owner
- **Admin**: Full access to all endpoints, user management, order management

## Testing

Run the test suite:
```bash
npm test
```

## Production Deployment

### Environment Variables

Set these in production:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://your-production-db-url
JWT_SECRET=your-super-secure-jwt-secret-256-bits
CORS_ORIGIN=https://yourdomain.com
```

### Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **JWT Secret**: Use a strong, random JWT secret (256+ bits)
3. **Database**: Use MongoDB Atlas or secure your MongoDB instance
4. **File Uploads**: 
   - For production, consider using AWS S3 or similar cloud storage
   - Current implementation stores files locally in `/uploads`
   - To switch to S3, update `config/multer.js` to use `multer-s3`
5. **Rate Limiting**: Adjust rate limits based on your needs
6. **CORS**: Configure CORS for your frontend domain only

### File Upload Migration to S3

To use AWS S3 for file uploads:

1. Install AWS SDK:
   ```bash
   npm install aws-sdk multer-s3
   ```

2. Update `config/multer.js`:
   ```javascript
   const aws = require('aws-sdk');
   const multerS3 = require('multer-s3');
   
   const s3 = new aws.S3({
     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
     region: process.env.AWS_REGION
   });
   
   const upload = multer({
     storage: multerS3({
       s3: s3,
       bucket: process.env.S3_BUCKET_NAME,
       key: function (req, file, cb) {
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         cb(null, `products/${uniqueSuffix}-${file.originalname}`);
       }
     })
   });
   ```

## Health Check

The server includes a health check endpoint:

```bash
GET /api/health

curl -X GET http://localhost:5000/api/health
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": ["Validation error details if applicable"]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License