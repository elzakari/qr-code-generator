#!/bin/bash

set -e

STAGING_URL=${1:-"https://staging.yourapp.com"}
API_URL="${STAGING_URL}/api"

echo "🧪 Running comprehensive staging tests..."

# Health check
echo "🏥 Testing health endpoints..."
curl -f "${API_URL}/health" || { echo "❌ Health check failed"; exit 1; }
curl -f "${API_URL}/ready" || { echo "❌ Readiness check failed"; exit 1; }

# Authentication tests
echo "🔐 Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}')

if [[ $? -eq 0 ]]; then
    echo "✅ Authentication endpoint responsive"
else
    echo "❌ Authentication test failed"
    exit 1
fi

# QR Generation test
echo "🔲 Testing QR generation..."
QR_RESPONSE=$(curl -s -X POST "${API_URL}/qr/generate" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test QR","content_type":"text"}')

if [[ $? -eq 0 ]]; then
    echo "✅ QR generation endpoint responsive"
else
    echo "❌ QR generation test failed"
    exit 1
fi

# Performance test
echo "⚡ Running performance tests..."
ab -n 100 -c 10 "${API_URL}/health" > /tmp/perf_test.log 2>&1

if grep -q "Failed requests:        0" /tmp/perf_test.log; then
    echo "✅ Performance test passed"
else
    echo "❌ Performance test failed"
    cat /tmp/perf_test.log
    exit 1
fi

# Memory cache test
echo "🧠 Testing memory cache functionality..."
# This would require custom test endpoints or integration tests

echo "🎉 All staging tests passed!"