let records = loadRecords();

// Bootstrap modal instances
let editModal = null;
let addModal = null;

// Current record being edited (OR)
let editingOr = null;

function sortRecords(arr) {
  return arr.sort((a, b) => Number(a.orNumber) - Number(b.orNumber));
}

function applySearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return records;

  return records.filter(r =>
    (r.orNumber || "").toLowerCase().includes(q) ||
    (r.account || "").toLowerCase().includes(q) ||
    (r.address || "").toLowerCase().includes(q) ||
    (r.remarks || "").toLowerCase().includes(q) ||
    (r.source || "").toLowerCase().includes(q)
  );
}

async function parseExcelFile(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

  return rows.filter(r => r.some(cell => String(cell ?? "").trim() !== ""));
}

async function importFiles(files) {
  const summary = { newCount: 0, updatedCount: 0, skippedCount: 0 };
  const map = new Map(records.map(r => [r.orNumber, r]));

  for (const file of files) {
    const fileType = detectFileType(file.name);
    if (fileType === "UNKNOWN") continue;

    const rows = await parseExcelFile(file);

    // Skip first row as "header guess"
    for (let i = 1; i < rows.length; i++) {
      const parsed = parseRowByType(fileType, rows[i]);
      if (!parsed) {
        summary.skippedCount++;
        continue;
      }

      const existing = map.get(parsed.orNumber);
      if (!existing) {
        map.set(parsed.orNumber, parsed);
        summary.newCount++;
      } else {
        map.set(parsed.orNumber, { ...existing, ...parsed });
        summary.updatedCount++;
      }
    }
  }

  records = sortRecords(Array.from(map.values()));
  saveRecords(records);

  const filtered = applySearch(document.getElementById("searchInput").value);
  renderTable(filtered);
  updateStats(records, summary);
}

/* ---------- CRUD helpers ---------- */

function getRecordByOr(orNumber) {
  return records.find(r => r.orNumber === orNumber) || null;
}

function updateRecord(updated) {
  const idx = records.findIndex(r => r.orNumber === updated.orNumber);
  if (idx === -1) return false;
  records[idx] = updated;
  records = sortRecords(records);
  saveRecords(records);
  return true;
}

function addRecord(newRec) {
  // OR must be unique
  if (getRecordByOr(newRec.orNumber)) return false;
  records.push(newRec);
  records = sortRecords(records);
  saveRecords(records);
  return true;
}

function deleteRecord(orNumber) {
  records = records.filter(r => r.orNumber !== orNumber);
  records = sortRecords(records);
  saveRecords(records);
}

function refreshUIAfterChange() {
  const filtered = applySearch(document.getElementById("searchInput").value);
  renderTable(filtered);
  updateStats(records, { newCount: 0, updatedCount: 0, skippedCount: 0 });
}

/* ---------- Modal helpers ---------- */

function showEditError(msg) {
  const el = document.getElementById("editError");
  el.textContent = msg;
  el.classList.remove("d-none");
}

function showAddError(msg) {
  const el = document.getElementById("addError");
  el.textContent = msg;
  el.classList.remove("d-none");
}

function resetAddModal() {
  document.getElementById("addOrNumber").value = "";
  document.getElementById("addAccount").value = "";
  document.getElementById("addAddress").value = "";
  document.getElementById("addAmount").value = "";
  document.getElementById("addRemarks").value = "";
  document.getElementById("addSource").value = "MANUAL";
  document.getElementById("addError").classList.add("d-none");
  document.getElementById("addError").textContent = "";
}

function openEditModal(orNumber) {
  const rec = getRecordByOr(orNumber);
  if (!rec) return;

  editingOr = orNumber;

  document.getElementById("editOrNumber").value = rec.orNumber || "";
  document.getElementById("editAccount").value = rec.account || "";
  document.getElementById("editAddress").value = rec.address || "";
  document.getElementById("editAmount").value = (Number(rec.amount || 0)).toFixed(2);
  document.getElementById("editRemarks").value = rec.remarks || "";
  document.getElementById("editSource").value = rec.source || "";
  document.getElementById("editError").classList.add("d-none");
  document.getElementById("editError").textContent = "";

  editModal.show();
}

/* ---------- Validation ---------- */

function normalizeOr(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  // digits only
  if (!/^\d+$/.test(v)) return "";
  return v;
}

function parseMoney(value) {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

/* ---------- DOM Ready ---------- */

document.addEventListener("DOMContentLoaded", () => {
  editModal = new bootstrap.Modal(document.getElementById("editModal"));
  addModal = new bootstrap.Modal(document.getElementById("addModal"));

  records = sortRecords(records);
  renderTable(records);
  updateStats(records);

  // Upload
  document.getElementById("fileInput").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) await importFiles(files);
    e.target.value = "";
  });

  // Search
  document.getElementById("searchInput").addEventListener("input", (e) => {
    renderTable(applySearch(e.target.value));
  });

  // Clear All
  document.getElementById("btnClearAll").addEventListener("click", () => {
    if (!confirm("Clear ALL saved records on this device?")) return;
    clearRecords();
    records = [];
    renderTable(records);
    updateStats(records, { newCount: 0, updatedCount: 0, skippedCount: 0 });
  });

  // Export
  document.getElementById("btnExportCSV").addEventListener("click", () => exportCSV(records));
  document.getElementById("btnExportExcel").addEventListener("click", () => exportExcel(records));

  // Open Add Modal
  document.getElementById("btnAddRecord").addEventListener("click", () => {
    resetAddModal();
    addModal.show();
    // focus OR
    setTimeout(() => document.getElementById("addOrNumber").focus(), 150);
  });

  // Save Add
  document.getElementById("btnSaveAdd").addEventListener("click", () => {
    const orNumber = normalizeOr(document.getElementById("addOrNumber").value);
    const account = document.getElementById("addAccount").value.trim();
    const address = document.getElementById("addAddress").value.trim();
    const amount = parseMoney(document.getElementById("addAmount").value);
    const remarks = document.getElementById("addRemarks").value.trim();
    const source = (document.getElementById("addSource").value || "MANUAL").trim();

    if (!orNumber) return showAddError("OR Number is required and must be digits only.");
    if (getRecordByOr(orNumber)) return showAddError("That OR Number already exists.");
    if (!account) return showAddError("Account name is required.");
    if (!address) return showAddError("Address is required.");
    if (!Number.isFinite(amount) || amount < 0) return showAddError("Amount must be a valid number (0 or more).");

    const newRec = {
      orNumber,
      account,
      address,
      amount,
      remarks,
      source
    };

    const ok = addRecord(newRec);
    if (!ok) return showAddError("Failed to add record (duplicate OR?).");

    addModal.hide();
    refreshUIAfterChange();
  });

  // Row actions (edit/delete)
  document.getElementById("tableBody").addEventListener("click", (e) => {
    const editBtn = e.target.closest(".js-edit");
    const delBtn = e.target.closest(".js-delete");

    if (editBtn) {
      const orNumber = editBtn.getAttribute("data-or");
      openEditModal(orNumber);
      return;
    }

    if (delBtn) {
      const orNumber = delBtn.getAttribute("data-or");
      const rec = getRecordByOr(orNumber);
      if (!rec) return;

      const msg =
        `Delete this record?\n\nOR: ${rec.orNumber}\nAccount: ${rec.account || ""}\nAmount: ${Number(rec.amount || 0).toFixed(2)}`;

      if (!confirm(msg)) return;

      deleteRecord(orNumber);
      refreshUIAfterChange();
      return;
    }
  });

  // Save Edit
  document.getElementById("btnSaveEdit").addEventListener("click", () => {
    if (!editingOr) return;

    const rec = getRecordByOr(editingOr);
    if (!rec) return showEditError("Record not found.");

    const account = document.getElementById("editAccount").value.trim();
    const address = document.getElementById("editAddress").value.trim();
    const remarks = document.getElementById("editRemarks").value.trim();
    const amount = parseMoney(document.getElementById("editAmount").value);

    if (!account) return showEditError("Account name is required.");
    if (!address) return showEditError("Address is required.");
    if (!Number.isFinite(amount) || amount < 0) return showEditError("Amount must be a valid number (0 or more).");

    const updated = {
      ...rec,
      account,
      address,
      remarks,
      amount
      // source remains unchanged
    };

    const ok = updateRecord(updated);
    if (!ok) return showEditError("Failed to save changes.");

    editModal.hide();
    editingOr = null;
    refreshUIAfterChange();
  });
});
