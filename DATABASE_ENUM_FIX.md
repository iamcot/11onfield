# Database Migration Fix for PlayerLevel Enum

## Problem
The error "No enum constant com.elevenof.backoffice.model.Player.PlayerLevel" occurs because existing player records have old string values that don't match the new enum constants.

## Solution

I've implemented **two solutions** - you can use either one:

### Solution 1: Custom AttributeConverter (Already Applied) ✅

A custom converter has been created that automatically handles invalid values by converting them to `null` instead of throwing an exception.

**Files modified:**
- `/backoffice/src/main/java/com/elevenof/backoffice/converter/PlayerLevelConverter.java` (NEW)
- `/backoffice/src/main/java/com/elevenof/backoffice/model/Player.java` - Updated to use the converter
- `/backoffice/src/main/java/com/elevenof/backoffice/repository/UserRepository.java` - Added `JpaSpecificationExecutor`
- `/backoffice/src/main/java/com/elevenof/backoffice/controller/api/UserController.java` - Fixed enum to string conversion

This solution will:
- **Log a warning** when it encounters an invalid value
- **Convert it to NULL** automatically
- Allow the application to continue running

### Solution 2: Clean Database (Optional)

If you want to clean up all existing invalid level values, run this SQL script:

```sql
-- Set all existing level values to NULL
UPDATE players SET level = NULL WHERE level IS NOT NULL;
```

Or connect to your MySQL database:
```bash
mysql -u root -p elevenof
```

Then run:
```sql
USE elevenof;
UPDATE players SET level = NULL WHERE level IS NOT NULL;
```

## How to Test

1. **Restart the backend server:**
   ```bash
   cd /Users/I762313/projects/personal/11of/backoffice
   mvn spring-boot:run
   ```

2. **Login to the application**
   - The error should no longer occur
   - If you see warnings in the logs like: "Invalid PlayerLevel value in database: 'xyz'. Converting to null." - that's normal and expected

3. **Update your player profile:**
   - Go to your profile page
   - Click "Sửa hồ sơ" (Edit Profile)
   - Select a level from the dropdown (Cầu thủ mới, Nghiệp dư, Tuyển trẻ, or Chuyên nghiệp)
   - Save

4. **Test the players listing:**
   - Navigate to `/players`
   - You should see the players list with filters
   - Test search, filters, and pagination

## What Changed

### Backend Changes:
1. **PlayerLevelConverter** - Gracefully handles invalid enum values
2. **UserRepository** - Now extends `JpaSpecificationExecutor` for advanced queries
3. **Player.java** - Uses custom converter instead of `@Enumerated`
4. **UserController** - Converts `PlayerLevel` enum to string for API response

### Frontend Changes:
- Profile page level input is now a dropdown with 4 options
- New players listing page with full filtering capabilities

## Valid Enum Values

The only valid values for the `level` field are now:
- `CAU_THU_MOI` - "Cầu thủ mới" (New player)
- `NGHIEP_DU` - "Nghiệp dư" (Amateur)
- `TUYEN_TRE` - "Tuyển trẻ" (Youth team)
- `CHUYEN_NGHIEP` - "Chuyên nghiệp" (Professional)

Any other value will be treated as NULL.
