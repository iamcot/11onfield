# UI Improvements - Players & Profile Pages

## Changes Made

### 1. ✅ Always Show Logout Button on Sidebar
**Changed:** Sidebar and MobileNav now always display the logout button, regardless of whose profile is being viewed.

**Files Modified:**
- [Sidebar.tsx](frontend-app/src/components/layout/Sidebar.tsx)
  - Removed `showLogout` prop (always show)
  - Made `onLogout` required

- [MobileNav.tsx](frontend-app/src/components/layout/MobileNav.tsx)
  - Removed `showLogout` prop (always show)
  - Made `onLogout` required

**Before:**
```typescript
<Sidebar showLogout={isOwnProfile} onLogout={handleLogout} />
```

**After:**
```typescript
<Sidebar onLogout={handleLogout} />
```

---

### 2. ✅ Hide Phone Number When Viewing Other Profiles
**Changed:** When viewing another person's profile, the phone number (username) is no longer displayed next to their full name. Gender icon still displays correctly.

**Files Modified:**
- [page.tsx](frontend-app/src/app/profile/[userid]/page.tsx) (Profile page)

**Before:**
```typescript
{!isOwnProfile && (
  <span className="ml-2 md:ml-3 text-xs md:text-sm font-normal text-gray-500">
    ({profileUser.username})
  </span>
)}
```

**After:**
This code block was removed entirely. Only gender icon shows.

---

### 3. ✅ Add Back Button to Profile Page (Conditional)
**Changed:** Added a "Quay lại" (Back) button above the avatar section that navigates back to the previous page. **The button only appears when the user came from the players list page.**

**Files Modified:**
- [page.tsx](frontend-app/src/app/profile/[userid]/page.tsx) (Profile page)
- [page.tsx](frontend-app/src/app/players/page.tsx) (Players list page)

**Implementation:**
- Players page adds `?from=players` query parameter when navigating to profile
- Profile page checks for `from=players` in URL search params
- Button only renders when this parameter is present

**Players Page Change:**
```typescript
const handleRowClick = (userid: string) => {
  router.push(`/profile/${userid}?from=players`);
};
```

**Profile Page Changes:**
```typescript
import { useParams, useRouter, useSearchParams } from "next/navigation";

// In component
const searchParams = useSearchParams();
const fromPlayers = searchParams.get("from") === "players";

// Conditional rendering
{fromPlayers && (
  <button
    onClick={() => router.back()}
    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    <span>Quay lại</span>
  </button>
)}
```

**Behavior:**
- **Shows:** When URL contains `?from=players` (navigating from players list)
- **Hidden:** When accessing profile directly via URL or from any other route

**Location:** Positioned above the profile card, below the banner image.

---

### 4. ✅ Change Sort Button to Dropdown with Multiple Options
**Changed:** Replaced the 3-state toggle sort button with a comprehensive dropdown that allows sorting by multiple fields.

**Files Modified:**
- [page.tsx](frontend-app/src/app/players/page.tsx) (Players list page)

**Sort Options Available:**
1. **Không sắp xếp** - No sorting
2. **Tên (A → Z)** - Name ascending
3. **Tên (Z → A)** - Name descending
4. **Tuổi (Tăng dần)** - Age ascending (youngest first)
5. **Tuổi (Giảm dần)** - Age descending (oldest first)
6. **Chiều cao (Thấp → Cao)** - Height ascending (shortest first)
7. **Chiều cao (Cao → Thấp)** - Height descending (tallest first)
8. **Cân nặng (Nhẹ → Nặng)** - Weight ascending (lightest first)
9. **Cân nặng (Nặng → Nhẹ)** - Weight descending (heaviest first)

**Before:**
```typescript
// Toggle button that cycled: none → asc → desc → none
<button onClick={handleSortToggle}>
  <span>Sắp xếp</span>
  {/* Icons showing current state */}
</button>
```

**After:**
```typescript
<select
  value={filters.sortBy ? `${filters.sortBy}-${filters.sortOrder}` : ""}
  onChange={(e) => {
    if (!e.target.value) {
      handleSortChange("", "asc");
    } else {
      const [sortBy, sortOrder] = e.target.value.split("-");
      handleSortChange(sortBy, sortOrder as "asc" | "desc");
    }
  }}
>
  <option value="">Không sắp xếp</option>
  <option value="fullName-asc">Tên (A → Z)</option>
  <option value="fullName-desc">Tên (Z → A)</option>
  <option value="dob-asc">Tuổi (Tăng dần)</option>
  <option value="dob-desc">Tuổi (Giảm dần)</option>
  <option value="height-asc">Chiều cao (Thấp → Cao)</option>
  <option value="height-desc">Chiều cao (Cao → Thấp)</option>
  <option value="weight-asc">Cân nặng (Nhẹ → Nặng)</option>
  <option value="weight-desc">Cân nặng (Nặng → Nhẹ)</option>
</select>
```

**New Handler Function:**
```typescript
const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
  if (sortBy === "") {
    // Clear sort
    setFilters(prev => {
      const { sortBy, sortOrder, ...rest } = prev;
      return rest;
    });
  } else {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  }
  setPagination(prev => ({ ...prev, page: 0 }));
};
```

---

## Backend Sort Field Mapping

The sort dropdown uses these field names that map to the backend entity:

| Frontend Sort By | Backend Field | Entity |
|------------------|---------------|--------|
| `fullName` | `fullName` | User |
| `dob` | `dob` | User (date of birth, sorts by age inversely) |
| `height` | `height` | Player (via JOIN) |
| `weight` | `weight` | Player (via JOIN) |

**Note:** For age sorting, we use `dob` (date of birth). Sorting by `dob` ascending gives youngest first, descending gives oldest first.

---

## Testing Checklist

### Profile Page:
- [ ] Navigate to `/profile/[userid]` for your own profile
- [ ] Verify logout button shows in sidebar (desktop)
- [ ] Verify logout button shows in mobile nav (mobile)
- [ ] Navigate to another user's profile
- [ ] Verify phone number is NOT shown next to their name
- [ ] Verify gender icon still displays correctly
- [ ] **Navigate directly to profile via URL** - back button should NOT appear
- [ ] **From players list, click a player** - back button SHOULD appear
- [ ] Click "Quay lại" button - should navigate back to players list
- [ ] Navigate from home page to profile - back button should NOT appear

### Players List Page:
- [ ] Navigate to `/players`
- [ ] Verify logout button shows in sidebar and mobile nav
- [ ] Open sort dropdown
- [ ] Verify all 9 options are present (including "Không sắp xếp")
- [ ] Select "Tên (A → Z)" - players should sort alphabetically
- [ ] Select "Tên (Z → A)" - players should sort reverse alphabetically
- [ ] Select "Tuổi (Tăng dần)" - youngest players first
- [ ] Select "Tuổi (Giảm dần)" - oldest players first
- [ ] Select "Chiều cao (Thấp → Cao)" - shortest players first
- [ ] Select "Chiều cao (Cao → Thấp)" - tallest players first
- [ ] Select "Cân nặng (Nhẹ → Nặng)" - lightest players first
- [ ] Select "Cân nặng (Nặng → Nhẹ)" - heaviest players first
- [ ] Select "Không sắp xếp" - default order restored
- [ ] Click a player row - should navigate to their profile
- [ ] Click back button on profile - should return to players list

---

## Summary

All requested changes have been implemented:

1. ✅ Logout button always visible on sidebar (desktop & mobile)
2. ✅ Phone number hidden when viewing other profiles
3. ✅ Back button added to profile page **only when coming from /players page**
4. ✅ Sort button changed to dropdown with 8 sort options (name, age, height, weight - each with asc/desc)

The application is ready for testing!
