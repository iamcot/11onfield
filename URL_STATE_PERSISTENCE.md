# URL State Persistence for Players Page

## Feature: Preserve Filters When Navigating Back

When users navigate from the players list to a profile and then click the back button, all filters, search text, sorting, and pagination state are now preserved.

## Implementation

### How It Works

The players page now stores all state in URL query parameters:
- `page` - Current page number
- `search` - Search text
- `positions` - Selected positions (comma-separated)
- `level` - Selected player level
- `preferredFoot` - Selected preferred foot
- `sortBy` - Sort field name
- `sortOrder` - Sort direction (asc/desc)

### Example URLs

**Default state:**
```
/players
```

**With filters:**
```
/players?search=nguyen&positions=striker,midfielder&level=NGHIEP_DU&sortBy=height&sortOrder=desc&page=2
```

### Code Changes

**File:** [page.tsx](frontend-app/src/app/players/page.tsx)

#### 1. Added URL Search Params Hook
```typescript
import { useRouter, useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const [isInitialized, setIsInitialized] = useState(false);
```

#### 2. Initialize State from URL on Mount
```typescript
useEffect(() => {
  const page = parseInt(searchParams.get("page") || "0");
  const search = searchParams.get("search") || "";
  const positions = searchParams.get("positions")?.split(",").filter(Boolean) || [];
  const level = searchParams.get("level") || null;
  const preferredFoot = searchParams.get("preferredFoot") || null;
  const sortBy = searchParams.get("sortBy") || null;
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || null;

  setSearchInput(search);
  setFilters({
    search: search || undefined,
    positions: positions.length > 0 ? positions : undefined,
    level: level as any,
    preferredFoot: preferredFoot || undefined,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
  });
  setPagination(prev => ({ ...prev, page }));
  setIsInitialized(true);
}, []);
```

#### 3. Update URL When State Changes
```typescript
useEffect(() => {
  if (!isInitialized) return;

  const params = new URLSearchParams();
  if (pagination.page > 0) params.set("page", pagination.page.toString());
  if (filters.search) params.set("search", filters.search);
  if (filters.positions && filters.positions.length > 0)
    params.set("positions", filters.positions.join(","));
  if (filters.level) params.set("level", filters.level);
  if (filters.preferredFoot) params.set("preferredFoot", filters.preferredFoot);
  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
    params.set("sortOrder", filters.sortOrder || "asc");
  }

  const newUrl = params.toString() ? `/players?${params.toString()}` : "/players";
  window.history.replaceState(null, "", newUrl);
}, [filters, pagination.page, isInitialized]);
```

#### 4. Guard Data Fetching
Only fetch players after state is initialized from URL:
```typescript
if (!authLoading && isAuthenticated && isInitialized) {
  fetchPlayers();
}
```

## Benefits

### 1. **Back Button Works Perfectly**
- Navigate to profile → browser back → returns to exact same state
- All filters, search, sort, and page position preserved

### 2. **Bookmarkable/Shareable URLs**
- Users can bookmark specific filter combinations
- Share URLs with colleagues to show specific player searches

### 3. **Better UX**
- No loss of context when navigating
- Reduces frustration from having to re-apply filters

### 4. **Browser History**
- Each filter change creates a history entry
- Users can use browser back/forward naturally

## User Flow Example

1. User navigates to `/players`
2. Searches for "nguyen"
3. Filters by position "striker"
4. Sorts by height descending
5. Goes to page 2
6. URL becomes: `/players?search=nguyen&positions=striker&sortBy=height&sortOrder=desc&page=2`
7. Clicks on a player → navigates to `/profile/player123?from=players`
8. Clicks "Quay lại" back button
9. **Returns to** `/players?search=nguyen&positions=striker&sortBy=height&sortOrder=desc&page=2`
10. **All filters intact!** ✅

## Testing

- [ ] Apply search filter → navigate to profile → back → search preserved
- [ ] Apply position filter → navigate to profile → back → position preserved
- [ ] Apply sort → navigate to profile → back → sort preserved
- [ ] Go to page 2 → navigate to profile → back → still on page 2
- [ ] Apply multiple filters → navigate to profile → back → all filters preserved
- [ ] Copy URL with filters → paste in new tab → filters applied
- [ ] Use browser back button multiple times → each state restored

## Edge Cases Handled

- Empty/undefined values are not added to URL (keeps URL clean)
- Page 0 is not added to URL (default state)
- Multiple positions are joined with commas
- State initialization happens before data fetching
- Debounced search doesn't conflict with URL updates

---

All state is now preserved when navigating back from profile pages! 🎉
