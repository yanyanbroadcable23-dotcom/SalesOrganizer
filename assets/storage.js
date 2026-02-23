const STORAGE_KEY = "salesOrganizerV5_records";

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function clearRecords() {
  localStorage.removeItem(STORAGE_KEY);
}