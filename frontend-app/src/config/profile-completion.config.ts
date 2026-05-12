/**
 * Configuration for player profile completion requirements
 * These fields will be checked after registration to determine if profile is complete
 */

export interface ProfileCompletionField {
  key: string;
  label: string;
  required: boolean;
}

export const profileCompletionConfig = {
  // Fields to check for PLAYER role
  playerRequiredFields: [
    { key: 'provinceId', label: 'Tỉnh/Thành phố', required: true },
    { key: 'positions', label: 'Vị trí thi đấu', required: true },
    { key: 'height', label: 'Chiều cao', required: false },
    { key: 'weight', label: 'Cân nặng', required: false },
    { key: 'preferredFoot', label: 'Chân thuận', required: false },
    { key: 'email', label: 'Email', required: false },
  ] as ProfileCompletionField[],

  // Check if player profile is incomplete
  isPlayerProfileIncomplete: (user: any): boolean => {
    // Check if user is a player (support both role and isPlayer fields)
    const isPlayer = user.role === 'PLAYER' || user.isPlayer === true;
    if (!isPlayer) return false;

    // Check required fields
    const requiredFields = profileCompletionConfig.playerRequiredFields.filter(
      (field) => field.required
    );

    for (const field of requiredFields) {
      const value = user[field.key] || user.playerProfile?.[field.key];

      // Check if field is empty
      if (!value || (Array.isArray(value) && value.length === 0)) {
        console.log(`[Profile Check] Missing required field: ${field.key}`, value);
        return true;
      }
    }

    console.log('[Profile Check] Profile is complete');
    return false;
  },
};
