# URL Parameters Quick Reference

## Advice Page (`/advice`)

### Basic Usage
```
/advice                    # V0 mode (default)
```

### V1 Features
```
/advice?v1=1              # Enable V1 multi-agent system
```

### Debug Mode
```
/advice?v1=1&debug=1      # Show active coaches panel
```

### Roleplay Mode
```
/advice?v1=1&roleplays=1  # Enable roleplay scenarios
```

### All Features
```
/advice?v1=1&debug=1&roleplays=1  # Everything enabled
```

## Onboarding Page (`/onboarding`)

### Basic Usage
```
/onboarding               # V0 mode (default)
```

### V1 Features
```
/onboarding?v1=1          # Enable assessment mapping & progress meter
```

## What Each Parameter Does

### `v1=1`
**Enables:**
- Multi-agent coach analysis (DBT, Self-Compassion, CBT)
- Personalized plan generation
- Coach tags in AI responses
- Assessment progress meter (onboarding)
- Enhanced system prompts

**Visible Changes:**
- Plan suggestion feature on advice page
- "💡 Suggest Plan" button appears
- Progress meter on onboarding page
- V1 features section in instructions

### `debug=1`
**Enables:**
- Coach activity panel (shows which coaches are active)
- Displays detected tags with confidence scores
- Useful for understanding what the system is detecting

**Visible Changes:**
- Purple "🔬 Active Coaches" panel appears
- Shows tags like "self-criticism (85%)", "distress-tolerance (75%)"

### `roleplays=1`
**Enables:**
- Roleplay scenario practice mode
- Structured coaching dialogues
- Action menu interactions

**Visible Changes:**
- "Practice a Scenario" section appears
- Can select from available roleplay scenarios
- Toggle roleplay mode on/off

## Feature Flag Requirements

URL parameters only work if corresponding environment variables are set:

| URL Parameter | Required ENV Vars |
|--------------|-------------------|
| `v1=1` | `FEATURE_V1=1` |
| `debug=1` | `FEATURE_V1=1` |
| `roleplays=1` | `FEATURE_V1=1`, `FEATURE_ROLEPLAYS=1` |

## Testing Combinations

### Minimal V1 Test
```
/advice?v1=1
```
Use this to test basic multi-agent functionality without extra features.

### Full Developer Test
```
/advice?v1=1&debug=1
```
Use this to see exactly what the coaches are detecting.

### Production Preview
```
/advice?v1=1
```
What users would see in production (no debug panel).

### Comprehensive Test
```
/advice?v1=1&debug=1&roleplays=1
```
Test all V1 features at once.

## Parameter Persistence

**Note:** URL parameters are NOT persistent. They must be included each time you navigate to the page.

**To make V1 default** (for testing):
- Modify the component to check `localStorage` for a preference
- Or modify the feature flag check to default to true

**Example:**
```typescript
// In useEffect
const v1Param = urlParams.get('v1') || localStorage.getItem('v1_enabled')
if (v1Param === '1') {
  setIsV1Enabled(true)
}
```

## Quick Links

### Development
- V0 Advice: http://localhost:3000/advice
- V1 Advice: http://localhost:3000/advice?v1=1
- V1 Advice (Debug): http://localhost:3000/advice?v1=1&debug=1
- V0 Onboarding: http://localhost:3000/onboarding
- V1 Onboarding: http://localhost:3000/onboarding?v1=1

### Production (when deployed)
Replace `localhost:3000` with your production domain:
- https://your-domain.com/advice?v1=1
- https://your-domain.com/onboarding?v1=1

## Related Documentation

- [Step 4 Testing Guide](./step4_testing_guide.md) - How to test the implementation
- [Step 4 Implementation Summary](./step4_implementation_summary.md) - Technical details
- [V1 Multi-Agent System](./v1_multi_agent_system.md) - System architecture
- [V1 Plan](./v1_plan.md) - Overall roadmap



