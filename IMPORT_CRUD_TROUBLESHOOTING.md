# Import CRUD Operations - Troubleshooting Guide

## Issue

Import entries cannot be edited or deleted in Mushok 6.1 (VAT Register).

## Latest Fixes Applied

### 1. Enhanced Logging

- ✅ Console logs added to all CRUD operations
- ✅ Request/response logging in API routes
- ✅ Form data logging in frontend

### 2. Better Error Messages

- ✅ Detailed error messages with descriptions
- ✅ Success confirmation messages
- ✅ Error details from API responses

### 3. Improved Error Handling

- ✅ Try-catch blocks in all operations
- ✅ Response validation
- ✅ Type conversion fixes

## How to Debug

### Step 1: Open Browser Console

1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Keep it open while testing

### Step 2: Try to Edit an Import

**Expected Console Output:**

```
Editing item: { id: 123, boe_no: "1064839", ... }
Form values: { boeNo: "1064839", boeDate: "2024-06-04", ... }
Saving import: { url: "/api/imports/123", method: "PUT", formData: {...} }
PUT request received for ID: 123
Request body: { boeNo: "1064839", ... }
Update result: [ { id: 123, ... } ]
Record updated successfully
Save response: { success: true, data: {...} }
```

**If Error Occurs:**

- Check console for error message
- Look for API response details
- Note the exact error text

### Step 3: Try to Delete an Import

**Expected Console Output:**

```
Deleting import ID: 123
Delete API called for ID: 123
Parsed ID: 123
Delete result: [ { id: 123, ... } ]
Record deleted successfully
Delete response: { success: true }
```

**If Error Occurs:**

- Check console for error message
- Look for API response details
- Note the exact error text

## Common Issues & Solutions

### Issue 1: "Failed to delete import"

**Possible Causes:**

1. Database connection issue
2. Record doesn't exist
3. Foreign key constraint
4. Permission issue

**Solution:**

1. Check console for detailed error
2. Verify record ID exists
3. Check if record is referenced elsewhere
4. Check database connection

**Console Command to Check:**

```javascript
// In browser console
fetch("/api/imports/123", { method: "DELETE" })
  .then((r) => r.json())
  .then(console.log);
```

### Issue 2: "Failed to save import" (Edit)

**Possible Causes:**

1. Invalid data format
2. Missing required fields
3. Type conversion error
4. Database constraint violation

**Solution:**

1. Check console for form data
2. Verify all required fields filled
3. Check date format (YYYY-MM-DD)
4. Check numeric values are valid

**Console Command to Check:**

```javascript
// In browser console
fetch("/api/imports/123", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    boeNo: "1064839",
    boeDate: "2024-06-04",
    itemNo: "1",
    // ... other fields
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

### Issue 3: Edit button doesn't open form

**Possible Causes:**

1. JavaScript error
2. State management issue
3. Form component not rendering

**Solution:**

1. Check console for errors
2. Verify `handleEdit` function called
3. Check `showAddForm` state
4. Check `editingId` state

### Issue 4: Form opens but data not populated

**Possible Causes:**

1. Data mapping issue
2. Field name mismatch
3. Type conversion error

**Solution:**

1. Check console for "Form values"
2. Verify field names match
3. Check data types

## Testing Checklist

### Edit Operation

- [ ] Click Edit button
- [ ] Form opens with existing data
- [ ] All fields populated correctly
- [ ] Modify some fields
- [ ] Click "Update Import"
- [ ] See success message
- [ ] Form closes
- [ ] Table refreshes with new data
- [ ] Check console for logs

### Delete Operation

- [ ] Click Delete button (trash icon)
- [ ] See confirmation dialog
- [ ] Click OK
- [ ] See success message
- [ ] Record removed from table
- [ ] Table refreshes
- [ ] Check console for logs

### Add Operation

- [ ] Click "Add Import" button
- [ ] Form opens empty
- [ ] Fill all required fields
- [ ] Click "Save Import"
- [ ] See success message
- [ ] Form closes
- [ ] New record appears in table
- [ ] Check console for logs

## API Endpoints

### GET Single Import

```
GET /api/imports/[id]
Response: { id, boeNo, boeDate, ... }
```

### POST New Import

```
POST /api/imports/single
Body: { boeNo, boeDate, itemNo, ... }
Response: { success: true, message: "...", id: 123 }
```

### PUT Update Import

```
PUT /api/imports/[id]
Body: { boeNo, boeDate, itemNo, ... }
Response: { success: true, data: {...} }
```

### DELETE Import

```
DELETE /api/imports/[id]
Response: { success: true }
```

## Database Schema

```sql
CREATE TABLE imports_boe (
  id SERIAL PRIMARY KEY,
  boe_no TEXT NOT NULL,
  boe_date TIMESTAMP NOT NULL,
  office_code TEXT,
  item_no TEXT NOT NULL,
  hs_code TEXT,
  description TEXT,
  assessable_value NUMERIC,
  base_vat NUMERIC,
  sd NUMERIC,
  vat NUMERIC,
  at NUMERIC,
  qty NUMERIC,
  unit TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Manual Testing Steps

### 1. Test Edit

```bash
# Open browser console and run:
const testEdit = async () => {
  const response = await fetch('/api/imports/123', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      boeNo: "TEST123",
      boeDate: "2024-06-04",
      itemNo: "1",
      description: "Test Item",
      assessableValue: "100000",
      vat: "15000"
    })
  });
  const result = await response.json();
  console.log('Edit result:', result);
};
testEdit();
```

### 2. Test Delete

```bash
# Open browser console and run:
const testDelete = async () => {
  const response = await fetch('/api/imports/123', {
    method: 'DELETE'
  });
  const result = await response.json();
  console.log('Delete result:', result);
};
testDelete();
```

## What to Report

If issues persist, please provide:

1. **Console Logs:**

   - Copy all console output
   - Include errors and warnings

2. **Network Tab:**

   - Open DevTools > Network
   - Filter by "Fetch/XHR"
   - Show request/response details

3. **Error Messages:**

   - Exact error text
   - When it occurs
   - What action triggered it

4. **Browser Info:**

   - Browser name and version
   - Operating system

5. **Data Sample:**
   - Record you're trying to edit/delete
   - Field values

## Quick Fixes

### Clear Browser Cache

```
Ctrl + Shift + Delete
Clear cached images and files
```

### Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Check Database Connection

```bash
# In project root
npm run db:test
```

## Status

```
✅ Logging enhanced
✅ Error handling improved
✅ Success messages added
✅ Build successful
⏳ Awaiting test results
```

---

**Next Steps:**

1. Clear browser cache
2. Refresh page
3. Try edit operation
4. Check console logs
5. Try delete operation
6. Check console logs
7. Report any errors with console output
