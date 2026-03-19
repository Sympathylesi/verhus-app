// Clear any oversized localStorage entries from the old seed before the app boots
try {
  ['verhus_entity_WeeklyEntry','verhus_entity_HealthArea','verhus_entity_District','verhus_entity_Alert',
   'verhus_demo_seeded_v2'].forEach(k => localStorage.removeItem(k));
} catch (_) {}
