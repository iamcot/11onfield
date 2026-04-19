#!/bin/bash
set -e

echo "Running health checks..."

# Backend health check
echo "Checking backend on port 8081..."
for i in {1..30}; do
    if curl -f -s http://localhost:8081/actuator/health | grep -q "UP"; then
        echo "✓ Backend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "✗ Backend health check failed"
        exit 1
    fi
    sleep 2
done

# Frontend health check
echo "Checking frontend on port 8080..."
for i in {1..30}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ Frontend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "✗ Frontend health check failed (HTTP $HTTP_CODE)"
        exit 1
    fi
    sleep 2
done

echo "✓ All services are healthy"
