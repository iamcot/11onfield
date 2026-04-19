# Active Navigation State - Sidebar & Mobile Nav

## Feature: Highlight Active Page in Navigation

Navigation items now highlight the current active page with visual feedback.

## Implementation

### Desktop Sidebar

**File:** [Sidebar.tsx](frontend-app/src/components/layout/Sidebar.tsx)

#### Changes:

1. **Added `usePathname` hook** from Next.js to get current route
2. **Added `isActive` prop** to NavItem component
3. **Conditional styling** based on active state

```typescript
import { usePathname } from "next/navigation";

const pathname = usePathname();

<NavItem
  icon={PlayerIcon}
  label="Cầu thủ"
  href="/players"
  collapsed={isCollapsed}
  isActive={pathname === "/players"}
/>
```

#### Active State Styling:
```typescript
className={`flex items-center gap-3 px-4 py-3 transition ${
  isActive
    ? "bg-green-100 text-green-700 font-medium"
    : "text-gray-700 hover:bg-green-50 hover:text-green-600"
}`}
```

**Active State:**
- Background: `bg-green-100` (light green)
- Text: `text-green-700` (darker green)
- Font: `font-medium` (slightly bolder)

**Inactive State:**
- Background: transparent (light green on hover)
- Text: `text-gray-700` (green on hover)
- Font: normal weight

---

### Mobile Navigation

**File:** [MobileNav.tsx](frontend-app/src/components/layout/MobileNav.tsx)

#### Changes:

1. **Added `usePathname` hook**
2. **Conditional styling** for active links

```typescript
import { usePathname } from "next/navigation";

const pathname = usePathname();

<Link
  href="/players"
  className={`flex flex-col items-center justify-center flex-1 transition ${
    pathname === "/players"
      ? "text-green-600 font-medium"
      : "text-gray-600 hover:text-green-600"
  }`}
>
```

**Active State:**
- Text/Icon: `text-green-600` (green)
- Font: `font-medium` (slightly bolder)

**Inactive State:**
- Text/Icon: `text-gray-600` (gray, green on hover)
- Font: normal weight

---

## Visual Design

### Desktop Sidebar - Active State:
```
┌─────────────────────┐
│  [Logo]             │
├─────────────────────┤
│  🏠 Trang chủ       │  ← Gray (inactive)
│  ✅ Cầu thủ         │  ← Green background (active)
│  🚪 Đăng xuất       │  ← Red (always inactive)
└─────────────────────┘
```

### Mobile Bottom Nav - Active State:
```
┌─────────────────────────────────┐
│  🏠      ✅Cầu thủ    🚪       │
│  Home   (active)   Logout      │
└─────────────────────────────────┘
```

---

## Route Matching

| Current Path | Active Nav Item |
|-------------|-----------------|
| `/` | Trang chủ (Home) |
| `/profile/[userid]` | Trang chủ (Home) |
| `/profile/[userid]/edit` | Trang chủ (Home) |
| `/players` | Cầu thủ (Players) |
| `/players?search=...` | Cầu thủ (Players) |

**Note:**
- The home nav item ("Trang chủ") is active for both `/` and any path starting with `/profile`
- This treats profile pages as part of the home section
- Query parameters don't affect matching

---

## Benefits

1. **Better User Orientation**
   - Users immediately see which page they're on
   - Reduces navigation confusion

2. **Visual Feedback**
   - Clear indication of current location in app
   - Professional, polished UI

3. **Consistent Across Devices**
   - Desktop sidebar and mobile nav both show active state
   - Same green color scheme maintained

4. **Accessible**
   - Color + font weight combination (not just color)
   - Works for users with color vision deficiency

---

## Testing

### Desktop Sidebar:
- [ ] Navigate to `/` → "Trang chủ" has green background
- [ ] Navigate to `/profile/[userid]` → "Trang chủ" has green background
- [ ] Navigate to `/players` → "Cầu thủ" has green background
- [ ] Apply filters on players page → "Cầu thủ" stays active
- [ ] Sidebar collapsed → active state still visible (background color)

### Mobile Navigation:
- [ ] Navigate to `/` → Home icon is green
- [ ] Navigate to `/profile/[userid]` → Home icon is green
- [ ] Navigate to `/players` → Players icon is green
- [ ] Apply filters → Players stays green

### Responsive:
- [ ] Switch between desktop and mobile → active state persists
- [ ] Resize window → active state remains consistent

---

## Color Scheme

| State | Desktop | Mobile |
|-------|---------|--------|
| **Active** | `bg-green-100 text-green-700` | `text-green-600` |
| **Inactive** | `text-gray-700` | `text-gray-600` |
| **Hover** | `bg-green-50 text-green-600` | `text-green-600` |

All colors match the app's green theme (`#16a34a` family).

---

Navigation now provides clear visual feedback about the current page! ✨
