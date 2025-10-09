#!/bin/bash

# Step 4 Testing Script
# Tests the complete multi-agent advice system integration

echo "🧪 CMC Sober Coach - Step 4 Integration Test"
echo "============================================="
echo ""

# Check if server is running
echo "📡 Checking dev server..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Dev server not running!"
    echo "Please run 'npm run dev' first."
    exit 1
fi
echo "✅ Server is running"
echo ""

# Store session cookie
COOKIE_FILE=$(mktemp)

echo "🧪 Test 1: Multi-Coach Detection"
echo "================================"
echo "Sending emotionally rich message..."
echo ""

RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "I feel like such a failure. I always mess everything up. I am so ashamed of myself. I cannot handle this overwhelming feeling."},
      {"role": "assistant", "content": "Thank you for sharing that. Tell me more."},
      {"role": "user", "content": "I just keep making the same mistakes. This is going to be a complete disaster."}
    ]
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract session ID from response
SESSION_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('sessionId', ''))" 2>/dev/null)

if [ -z "$SESSION_ID" ]; then
    echo "⚠️  Could not extract session ID"
else
    echo "✅ Session ID: $SESSION_ID"
fi
echo ""

echo "🧪 Test 2: Plan Generation"
echo "=========================="
echo "Generating personalized plan..."
echo ""

PLAN_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "I feel like such a failure. I always mess everything up. I am so ashamed. I cannot handle this stress."},
      {"role": "assistant", "content": "I hear that you are struggling."},
      {"role": "user", "content": "Yes, I just want to give up. Everything is falling apart."}
    ]
  }')

echo "$PLAN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PLAN_RESPONSE"
echo ""

# Extract plan details
PLAN_ACTIONS=$(echo "$PLAN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('plan', {}).get('actions', [])) if 'plan' in data else 0)" 2>/dev/null)

if [ "$PLAN_ACTIONS" -gt 0 ]; then
    echo "✅ Plan generated with $PLAN_ACTIONS actions"
else
    echo "⚠️  No actions in plan or plan generation failed"
fi
echo ""

echo "🧪 Test 3: Get Recent Events"
echo "============================"
echo "Retrieving event history..."
echo ""

EVENTS_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X GET "http://localhost:3000/api/events?limit=10")

echo "$EVENTS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$EVENTS_RESPONSE"
echo ""

echo "============================================="
echo "✅ API Testing Complete!"
echo ""
echo "📱 Browser Testing:"
echo "  1. Visit: http://localhost:3000/advice?v1=1"
echo "  2. Send emotional messages to trigger coaches"
echo "  3. Click '💡 Suggest Plan' or wait for auto-trigger"
echo "  4. Review generated plan with action items"
echo ""
echo "🔬 Debug Mode:"
echo "  Visit: http://localhost:3000/advice?v1=1&debug=1"
echo "  Watch the purple 'Active Coaches' panel"
echo ""
echo "📊 Check browser console for 'Coach events logged'"
echo ""

# Cleanup
rm -f "$COOKIE_FILE"



