# Clear Filters Button - Players Page

## Feature: Clear All Filters Button

Added a button to quickly reset all filters, search text, and sorting on the players page.

## Implementation

### Button Behavior

The "Xóa bộ lọc" (Clear filters) button:
- **Only appears when filters are active** (conditional rendering)
- **Clears all state:**
  - Search text
  - Position filter
  - Level filter
  - Preferred foot filter
  - Sort field and order
  - Resets to page 0

### Code Changes

**File:** [page.tsx](frontend-app/src/app/players/page.tsx)

#### 1. Added Clear Handler
```typescript
const handleClearFilters = () => {
  setSearchInput("");
  setFilters({});
  setPagination(prev => ({ ...prev, page: 0 }));
};
```

#### 2. Added Button with Conditional Rendering
```typescript
{/* Clear Filters Button */}
{(searchInput || filters.positions?.length || filters.level ||
  filters.preferredFoot || filters.sortBy) && (
  <div className="mt-4 flex justify-end">
    <button
      onClick={handleClearFilters}
      className="px-4 py-2 text-sm text-red-600 hover:text-red-700
                 hover:bg-red-50 rounded-md transition flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span>Xóa bộ lọc</span>
    </button>
  </div>
)}
```

## Visual Design

- **Position:** Right-aligned, below filter dropdowns
- **Color:** Red text (`text-red-600`) to indicate reset/removal action
- **Hover state:** Red background tint (`hover:bg-red-50`)
- **Icon:** X icon (cross) to indicate clearing/removal
- **Visibility:** Hidden when no filters are active

## Button States

### Visible When:
- Search text is entered
- Position filter is selected
- Level filter is selected
- Preferred foot filter is selected
- Sort is applied

### Hidden When:
- All filters are empty/default
- Fresh page load with no filters

## User Flow

1. User applies filters:
   - Search: "nguyen"
   - Position: "striker"
   - Level: "NGHIEP_DU"
   - Sort: height descending

2. **"Xóa bộ lọc" button appears** (right-aligned below filters)

3. User clicks button

4. **All state cleared:**
   - Search input becomes empty
   - All dropdowns reset to default ("Tất cả...")
   - Sort dropdown shows "Không sắp xếp"
   - Returns to page 1
   - Shows all players

5. Button disappears (no active filters)

## Integration with URL State

Since the players page uses URL parameters for state:
- Clearing filters updates the URL to `/players` (no query params)
- Browser back button still works correctly
- Bookmark/share URL reflects the cleared state

## Testing

- [ ] Apply search → "Xóa bộ lọc" button appears
- [ ] Click button → search clears
- [ ] Apply position filter → button appears
- [ ] Click button → position resets to "Tất cả vị trí"
- [ ] Apply multiple filters → button appears
- [ ] Click button → all filters clear at once
- [ ] Apply sort → button appears
- [ ] Click button → sort resets to "Không sắp xếp"
- [ ] With no filters active → button is hidden
- [ ] After clearing → URL becomes `/players` (no params)

## Styling Details

```css
/* Button Classes */
px-4 py-2          /* Padding */
text-sm            /* Font size */
text-red-600       /* Red text (default) */
hover:text-red-700 /* Darker red on hover */
hover:bg-red-50    /* Light red background on hover */
rounded-md         /* Rounded corners */
transition         /* Smooth hover animation */
flex items-center gap-2  /* Icon + text layout */
```

---

Users can now quickly reset all filters with one click! 🎉
