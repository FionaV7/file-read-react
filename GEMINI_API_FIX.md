# Gemini API Error Fix Guide

## Error: "404 models/gemini-1.5-pro is not found for API version v1beta"

### Root Causes

1. **Invalid or Expired API Key** - The primary cause
2. **API Key Missing Permissions** - Key doesn't have `generateContent` permission
3. **API Quota Exceeded** - Rate limiting or daily quota reached
4. **Wrong Model Name** - Using unsupported model names
5. **Account Issues** - API key associated with disabled/invalid account

---

## Solutions

### ✅ Step 1: Verify API Key (CRITICAL)

Check your `.env` file in the backend directory:

```bash
# backend/.env
GEMINI_API_KEY=your_actual_api_key_here
```

The API key should:
- Be 39+ characters long
- Start with `AIza...`
- Be obtained from: https://aistudio.google.com/app/apikeys

### ✅ Step 2: Regenerate API Key (If Invalid)

1. Go to: https://aistudio.google.com/app/apikeys
2. Click "Delete" on expired keys
3. Click "Create new API key in new project"
4. Copy the key and update `.env`:
   ```
   GEMINI_API_KEY=your_new_key_here
   ```
5. Restart backend server

### ✅ Step 3: Check API Permissions

Ensure your Google Cloud Project has:
- ✅ Generative AI API enabled
- ✅ Correct API quotas configured
- ✅ No API restrictions blocking your requests

Steps:
1. Visit: https://console.cloud.google.com
2. Select your project
3. Go to APIs & Services → Enabled APIs
4. Verify "Generative AI API" is enabled
5. Check quotas: Go to APIs & Services → Quotas

### ✅ Step 4: Update Model Configuration

Supported models in order of capability:
1. `gemini-2.0-flash` (Latest - Recommended)
2. `gemini-1.5-pro` (Pro - Complex tasks)
3. `gemini-1.5-flash` (Currently used - Balanced)

To change model, edit [backend/services/rag_engine.py](backend/services/rag_engine.py#L15):

```python
self.model = genai.GenerativeModel('gemini-2.0-flash')  # Change this line
```

### ✅ Step 5: Check API Rate Limits

Free tier limits:
- **60 requests per minute** (QPM)
- **1 million tokens per day**

If exceeded, you'll get quota errors. Solutions:
- Wait 1 minute before retry
- Implement request queue/throttling
- Upgrade to paid plan for higher limits

---

## Testing the Fix

Run this test script to verify the API key works:

```bash
# From backend directory
python test_gemini_api.py
```

Or test directly:

```python
import google.generativeai as genai
import os

# Test API configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

try:
    response = model.generate_content("Hello, is the API working?")
    print("✅ API is working!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ API Error: {e}")
```

---

## Auto-Logout on New Session

### What Changed
- When a new browser session starts, both guest and user accounts are **automatically logged out**
- This clears all authentication tokens and session data
- Page refresh within the same session does NOT logout users

### How It Works

**[App.jsx](frontend/src/App.jsx)** checks for a session ID:
```javascript
- First visit: NO sessionId → Clear localStorage → Set new sessionId
- Page refresh: sessionId exists → Keep logged in
- New browser tab: NO sessionId → Auto logout
```

### Cleared Data
On new session, these are cleared:
- ❌ Authentication tokens
- ❌ User login data
- ❌ Guest session data
- ❌ LocalStorage (except sessionId)

---

## Error Messages Explained

### If you see these errors, here's what to do:

| Error | Cause | Fix |
|-------|-------|-----|
| `404 models/gemini-1.5-pro` | Invalid API key | Step 1-2: Regenerate key |
| `401 Unauthenticated` | API key expired | Step 2: Get new key |
| `Quota exceeded` | Rate limit hit | Wait 1 minute or upgrade plan |
| `Invalid API key` | Wrong key format | Copy key correctly from aistudio.google.com |

---

## Files Modified

1. **[backend/services/rag_engine.py](backend/services/rag_engine.py)**
   - Enhanced error handling with specific error messages
   - Better error diagnostics for API failures

2. **[frontend/src/App.jsx](frontend/src/App.jsx)**
   - Auto-logout improved on new sessions
   - Proper session ID validation
   - Clears all auth data (guest + user)

3. **[frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)**
   - Added `loginAsGuest()` method
   - Better logout functionality
   - Session sync across storage events

---

## Quick Checklist

- [ ] API key is valid (39+ chars, starts with AIza)
- [ ] `.env` file has correct key
- [ ] Generative AI API is enabled in Google Cloud
- [ ] Backend server restarted after `.env` changes
- [ ] API quotas not exceeded
- [ ] Using supported model (gemini-1.5-flash or gemini-2.0-flash)
- [ ] Test API key with test script

---

## Still Having Issues?

1. **Clear cache & restart:**
   ```bash
   # Backend
   Ctrl+C  # Stop server
   # Delete __pycache__ folders
   python main.py

   # Frontend  
   Ctrl+C  # Stop dev server
   npm run dev
   ```

2. **Check logs for detailed errors:**
   - Backend console output
   - Browser DevTools (F12 → Console)
   - Network tab for API responses

3. **Test with curl:**
   ```bash
   curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"test"}]}]}'
   ```

---

**Last Updated:** March 2026
