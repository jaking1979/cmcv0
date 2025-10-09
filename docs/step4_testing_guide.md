# Step 4 Testing Guide: Multi-Agent Advice System

This guide helps you test the newly implemented multi-agent advice system.

## Prerequisites

1. **Environment Setup**: Make sure `.env.local` has:
   ```
   OPENAI_API_KEY=your_actual_key
   OPENAI_MODEL=gpt-4o-mini
   FEATURE_V1=1
   FEATURE_COACHES=1
   FEATURE_PLAN=1
   NODE_ENV=development
   ```

2. **Dev Server Running**: 
   ```bash
   npm run dev
   ```

## Testing in Browser

### Test 1: Basic V1 Advice Flow

1. Navigate to: `http://localhost:3000/advice?v1=1`

2. Type a message with emotional content:
   ```
   I feel like such a failure. I always mess everything up and I'm so ashamed of myself.
   ```

3. **What to check**:
   - ✅ Chat responds normally
   - ✅ Open browser DevTools Console (F12)
   - ✅ Look for: `"Coach events logged:"` with array of events
   - ✅ Should see coaches like `dbt`, `self-compassion`, or `cbt`

4. Continue the conversation with 2-3 more exchanges

5. **After 4+ messages**, you should see:
   - 💡 A green "Ready for a personalized plan?" card appears
   - Click "Yes, create my plan"
   - Wait ~2-3 seconds
   - A beautiful plan card appears with categorized action items

### Test 2: Manual Plan Trigger

1. Navigate to: `http://localhost:3000/advice?v1=1`

2. Send 2 messages (any content)

3. **Look for the "💡 Suggest Plan" button** in the top right area

4. Click it to manually trigger the plan CTA

5. Click "Yes, create my plan"

6. **What to verify**:
   - ✅ Plan generates with 3-5 action items
   - ✅ Actions are categorized: ⚡ Immediate, 📅 Short-term, 🎯 Long-term
   - ✅ Each action has a difficulty badge (easy/medium/hard)
   - ✅ "Accept & Continue" adds a follow-up message
   - ✅ "Dismiss" closes the plan

### Test 3: Debug Mode (Coach Visibility)

1. Navigate to: `http://localhost:3000/advice?v1=1&debug=1`

2. Send messages with different patterns:
   - Self-criticism: "I'm such a failure"
   - Distress: "I can't handle this overwhelming feeling"
   - Cognitive distortion: "Everything always goes wrong"

3. **What to check**:
   - 🔬 Purple "Active Coaches" panel appears
   - Shows detected tags like `self-criticism`, `distress-tolerance`, `all-or-nothing`
   - Each tag shows confidence percentage

### Test 4: Coach Context in Responses

1. Navigate to: `http://localhost:3000/advice?v1=1&debug=1`

2. Send: "I feel like such a terrible person. I'm so ashamed."

3. Check console - should see self-compassion tags

4. Continue conversation - notice AI responses may be more attuned to self-compassion themes

## Testing via API (Terminal)

### Test Events API

```bash
# Test 1: Self-criticism (should trigger self-compassion coach)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "I feel like such a failure. I always mess everything up. I am so ashamed of myself."}
    ]
  }'
```

**Expected output**: Events array with `self-compassion` and `cbt` coaches

```bash
# Test 2: Distress (should trigger DBT coach)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "I cannot handle this overwhelming feeling. Everything is too much."}
    ]
  }'
```

**Expected output**: Events array with `dbt` coach

### Test Plan API

```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "I feel overwhelmed and like a failure. I cannot handle the stress and always mess things up."}
    ]
  }'
```

**Expected output**: 
- `plan.summary` - 2-3 sentence overview
- `plan.actions[]` - Array of 3-5 actions
- Each action has: `title`, `description`, `category`, `difficulty`

## What Success Looks Like

### Browser Console Output
```
Coach events logged: [
  {
    coachType: "self-compassion",
    tags: [
      {type: "emotion", value: "self-criticism", confidence: 0.85}
    ],
    confidence: 0.85
  },
  {
    coachType: "cbt",
    tags: [
      {type: "behavior", value: "cognitive-distortion-all-or-nothing", confidence: 0.7}
    ],
    confidence: 0.7
  }
]
```

### Plan Display in UI
```
┌─────────────────────────────────────────────┐
│ 📋 Your Personalized Plan                   │
│ Confidence: 80%                              │
│                                              │
│ Based on what you've shared, here's a plan  │
│ focusing on self-compassion and managing    │
│ overwhelming feelings...                     │
│                                              │
│ ⚡ IMMEDIATE ACTIONS                         │
│ ┌─────────────────────────────────────────┐ │
│ │ 1 Grounding Technique          [Easy]   │ │
│ │   When overwhelmed, try 5-4-3-2-1...    │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ 📅 SHORT-TERM ACTIONS                        │
│ ...                                          │
│                                              │
│ [Accept & Continue]  [Dismiss]               │
└─────────────────────────────────────────────┘
```

## Troubleshooting

### "Events logging not enabled"
- Check `.env.local` has `FEATURE_V1=1` and `FEATURE_COACHES=1`
- Restart dev server after changing `.env.local`

### Empty events array
- Message might be too short or lack strong signals
- Try longer messages with emotional content
- Examples that work: "I feel like a failure", "I can't handle this", "Everything always goes wrong"

### Plan not appearing
- Need at least 2 messages in conversation
- Try clicking "💡 Suggest Plan" button manually
- Check console for errors

### No coach tags in console
- Make sure URL has `?v1=1`
- Check that messages contain emotional/distress content
- Verify feature flags are set correctly

## Feature Flags for Testing

- **V1 Only**: `http://localhost:3000/advice?v1=1`
- **V1 + Debug**: `http://localhost:3000/advice?v1=1&debug=1`
- **V1 + Roleplays**: `http://localhost:3000/advice?v1=1&roleplays=1`
- **All Features**: `http://localhost:3000/advice?v1=1&debug=1&roleplays=1`

## Success Criteria

- [x] Events API logs coach insights after each message
- [x] Plan CTA appears after sufficient conversation
- [x] Plan generates with proper structure and categories
- [x] Coach tags are passed to advice API for contextual responses
- [x] Debug mode shows active coaches and tags
- [x] Manual plan trigger works
- [x] Plan Accept/Dismiss buttons work correctly
- [x] Mobile-responsive design maintained
- [x] No linting errors
- [x] Crisis detection still works

## Next Steps

After validating Step 4, the following features can be added:
- Roleplay scenario integration
- Onboarding assessment mapping endpoint
- Learning modules with progress tracking
- PWA features



