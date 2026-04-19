# Sort Fix: Player Properties with JPA Joins

## Issue
When sorting by `height` or `weight`, the application threw an error:
```
org.springframework.data.mapping.PropertyReferenceException: No property 'height' found for type 'User'
```

## Root Cause
The properties `height` and `weight` belong to the `Player` entity, not the `User` entity. When using JPA Specification with joins, Spring Data JPA needs the full path including the relationship name.

## Solution
Map frontend sort field names to backend entity paths with proper join prefixes.

### Backend Fix

**File:** `/backoffice/src/main/java/com/elevenof/backoffice/controller/api/UserController.java`

**Before:**
```java
Sort sort = Sort.unsorted();
if (sortBy != null && !sortBy.isEmpty()) {
    sort = sortOrder.equalsIgnoreCase("desc")
        ? Sort.by(sortBy).descending()
        : Sort.by(sortBy).ascending();
}
```

**After:**
```java
Sort sort = Sort.unsorted();
if (sortBy != null && !sortBy.isEmpty()) {
    String sortProperty = sortBy;

    // Map frontend sort fields to backend entity paths
    // Player properties need the "player." prefix for the join
    switch (sortBy) {
        case "height":
        case "weight":
            sortProperty = "player." + sortBy;
            break;
        case "fullName":
        case "dob":
            // User properties - use as is
            sortProperty = sortBy;
            break;
        default:
            sortProperty = sortBy;
    }

    sort = sortOrder.equalsIgnoreCase("desc")
        ? Sort.by(sortProperty).descending()
        : Sort.by(sortProperty).ascending();
}
```

## Entity Relationship

```
User (main entity)
├── id (Long)
├── fullName (String)
├── dob (LocalDate)
├── phone (String)
└── player (OneToOne)
    └── Player
        ├── height (Integer)
        ├── weight (Integer)
        ├── positions (String)
        └── preferredFoot (String)
```

## Sort Field Mapping

| Frontend sortBy | Backend Path | Entity |
|----------------|--------------|--------|
| `fullName` | `fullName` | User |
| `dob` | `dob` | User |
| `height` | `player.height` | Player (via join) |
| `weight` | `player.weight` | Player (via join) |

## Why This Works

When JPA Specification creates the query with a join:
```sql
SELECT u FROM User u LEFT JOIN u.player p WHERE ...
```

The sort needs to reference the joined entity:
- ✅ `ORDER BY p.height` (correct - uses join alias)
- ❌ `ORDER BY u.height` (wrong - property doesn't exist on User)

By using `player.height` as the sort property, Spring Data JPA correctly interprets it as:
```sql
ORDER BY u.player.height DESC
```

Which translates to the proper SQL join path.

## Testing

All sort options now work correctly:

- ✅ Tên (A → Z) - sorts by `fullName`
- ✅ Tên (Z → A) - sorts by `fullName` descending
- ✅ Tuổi (Tăng dần) - sorts by `dob` ascending (youngest first)
- ✅ Tuổi (Giảm dần) - sorts by `dob` descending (oldest first)
- ✅ Chiều cao (Thấp → Cao) - sorts by `player.height` ascending
- ✅ Chiều cao (Cao → Thấp) - sorts by `player.height` descending
- ✅ Cân nặng (Nhẹ → Nặng) - sorts by `player.weight` ascending
- ✅ Cân nặng (Nặng → Nhẹ) - sorts by `player.weight` descending

---

The sort functionality is now fully working! 🎉
