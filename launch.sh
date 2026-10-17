#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting backend (Spring Boot :7071)..."
osascript -e "
  tell application \"Terminal\"
    do script \"cd '$ROOT/backoffice' && mvn spring-boot:run\"
  end tell
"

echo "Starting frontend (Next.js :7070)..."
osascript -e "
  tell application \"Terminal\"
    do script \"cd '$ROOT/frontend-app' && npm run dev\"
  end tell
"

echo "Both apps launching:"
echo "  Frontend -> http://localhost:7070"
echo "  Backend  -> http://localhost:7071"
