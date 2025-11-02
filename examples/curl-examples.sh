#!/bin/bash

# VAT Dashboard Auth System - Example cURL Commands
BASE_URL="http://localhost:3000"

echo "🔐 VAT Dashboard Auth System Test"
echo "================================="

# 1. Test public endpoint (no auth required)
echo "1. Testing public endpoint..."
curl -i "$BASE_URL/api/public/latest"
echo -e "\n"

# 2. Test unauthenticated write (should return 401)
echo "2. Testing unauthenticated write request..."
curl -i -X POST "$BASE_URL/api/sales" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
echo -e "\n"

# 3. Admin login (captures cookies)
echo "3. Admin login..."
COOKIE_JAR=$(mktemp)
LOGIN_RESPONSE=$(curl -i -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vatdashboard.com",
    "password": "VatAdmin2024!"
  }')

echo "$LOGIN_RESPONSE"

# Extract CSRF token from cookies
CSRF_TOKEN=$(grep csrf "$COOKIE_JAR" | awk '{print $7}')
echo "CSRF Token: $CSRF_TOKEN"
echo -e "\n"

# 4. Test authenticated request without CSRF (should return 403)
echo "4. Testing authenticated request without CSRF token..."
curl -i -b "$COOKIE_JAR" -X POST "$BASE_URL/api/sales" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
echo -e "\n"

# 5. Test authenticated request with CSRF (should work)
echo "5. Testing authenticated request with CSRF token..."
curl -i -b "$COOKIE_JAR" -X POST "$BASE_URL/api/sales" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -d '{
    "date": "2024-11-02",
    "invoiceNo": "TEST-001",
    "customer": "Test Customer",
    "amountType": "INCL",
    "grandTotal": 1150,
    "lines": [{
      "productId": 1,
      "qty": 1,
      "unitPrice": 1000,
      "unit": "pcs",
      "lineAmount": 1000
    }]
  }'
echo -e "\n"

# 6. Check auth status
echo "6. Checking auth status..."
curl -i -b "$COOKIE_JAR" "$BASE_URL/api/auth/me"
echo -e "\n"

# 7. Logout
echo "7. Logout..."
curl -i -b "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/logout"
echo -e "\n"

# Cleanup
rm -f "$COOKIE_JAR"

echo "Test completed!"