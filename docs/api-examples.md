# API Examples and Postman Collection

## Complete API Testing Guide

### 1. Authentication Flow

#### Step 1: Create Admin Account (using seed data)
The seed script creates an admin account:
- Phone: `9999999999`
- Password: `admin123` (or from env)

#### Step 2: User Registration
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/signup/user \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "phone": "9876543213",
    "password": "password123",
    "confirmPassword": "password123",
    "referral": "WELCOME2024"
  }'
```

#### Step 3: Shop Owner Registration
```bash
# Register a shop owner
curl -X POST http://localhost:5000/api/auth/signup/shopowner \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics Hub",
    "phone": "9876543214",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "shopowner",
    "gstNumber": "27AAAAA0000A1Z5",
    "shopName": "Electronics Hub Store"
  }'
```

### 2. Product Management Workflow

#### Step 1: Login as Admin
```bash
# Login and save the token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9999999999",
    "password": "admin123"
  }'
```

#### Step 2: Create Category
```bash
# Create a new category
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Smart Devices",
    "description": "IoT and smart home devices"
  }'
```

#### Step 3: Add Product with Images
```bash
# Add product with image upload
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Smart WiFi Switch" \
  -F "description=WiFi enabled smart switch with app control" \
  -F "aboutProduct=Control your lights remotely with this smart WiFi switch. Easy installation, works with Alexa and Google Home. Energy monitoring included." \
  -F "price=899" \
  -F "stock=25" \
  -F "category=CATEGORY_ID" \
  -F "images=@/path/to/product-image.jpg"
```

### 3. Shopping Flow

#### Step 1: Browse Products
```bash
# Get products with filters
curl -X GET "http://localhost:5000/api/products?page=1&limit=5&category=CATEGORY_ID&search=LED&sort=-rating"
```

#### Step 2: View Product Details
```bash
# Get single product
curl -X GET http://localhost:5000/api/products/PRODUCT_ID
```

#### Step 3: Add to Favorites
```bash
# Toggle favorite
curl -X POST http://localhost:5000/api/favorites/toggle/PRODUCT_ID \
  -H "Authorization: Bearer USER_TOKEN"
```

#### Step 4: Place Order
```bash
# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product": "PRODUCT_ID_1",
        "quantity": 2
      },
      {
        "product": "PRODUCT_ID_2",
        "quantity": 1
      }
    ],
    "shippingAddress": {
      "street": "456 Oak Avenue, Apartment 2B",
      "city": "Delhi",
      "state": "Delhi",
      "zipCode": "110001"
    },
    "paymentMethod": "online",
    "notes": "Please call before delivery"
  }'
```

### 4. Order Management

#### Track Orders (User)
```bash
# Get user's orders
curl -X GET http://localhost:5000/api/orders/my-orders?page=1&status=placed \
  -H "Authorization: Bearer USER_TOKEN"
```

#### Manage All Orders (Admin)
```bash
# Get all orders
curl -X GET "http://localhost:5000/api/orders?page=1&status=processing" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Update order status
curl -X PUT http://localhost:5000/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped"
  }'
```

### 5. Advanced Features

#### Product Rating
```bash
# Rate a product
curl -X POST http://localhost:5000/api/products/PRODUCT_ID/rate \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5
  }'
```

#### Search and Filter
```bash
# Advanced product search
curl -X GET "http://localhost:5000/api/products?search=smart%20bulb&minPrice=100&maxPrice=500&sort=price&page=1&limit=20"
```

## Response Examples

### Successful Login Response
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a1b2c3d4e5f6789012345",
    "name": "John Doe",
    "phone": "9876543210",
    "role": "user"
  }
}
```

### Product List Response
```json
{
  "products": [
    {
      "_id": "64a1b2c3d4e5f6789012346",
      "title": "LED Bulb 9W Cool White",
      "description": "Energy efficient LED bulb",
      "price": 150,
      "stock": 100,
      "category": {
        "_id": "64a1b2c3d4e5f6789012347",
        "title": "Lighting",
        "slug": "lighting"
      },
      "images": ["/uploads/image-1234567890.jpg"],
      "rating": 4.5,
      "ratingCount": 24
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 45,
    "limit": 10
  }
}
```

### Order Response
```json
{
  "message": "Order placed successfully",
  "order": {
    "_id": "64a1b2c3d4e5f6789012348",
    "user": "64a1b2c3d4e5f6789012345",
    "items": [
      {
        "product": "64a1b2c3d4e5f6789012346",
        "quantity": 2,
        "price": 150,
        "title": "LED Bulb 9W Cool White"
      }
    ],
    "total": 300,
    "status": "placed",
    "shippingAddress": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001"
    },
    "paymentMethod": "cod",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Responses

### Validation Error
```json
{
  "error": "Validation failed",
  "details": [
    {
      "type": "field",
      "msg": "Password must be at least 6 characters",
      "path": "password",
      "location": "body"
    }
  ]
}
```

### Authentication Error
```json
{
  "error": "Access denied. No token provided."
}
```

### Not Found Error
```json
{
  "error": "Product not found"
}
```

## Testing Tips

1. **Use the seed data**: Run `npm run seed` to populate with test data
2. **Test accounts available after seeding**:
   - Admin: `9999999999` / `admin123`
   - User: `9876543210` / `password123`
   - Shop Owner: `9876543211` / `password123`
   - Electrician: `9876543212` / `password123`

3. **File uploads**: Use actual image files for testing product uploads
4. **Rate limiting**: Be aware of rate limits during testing (100 requests per 15 minutes)
5. **Stock management**: Orders will decrease product stock automatically