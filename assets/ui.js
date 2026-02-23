function escapeHtml(str) {
    return (str ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  
  function renderTable(records) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";
  
    for (const r of records) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="white-space:nowrap;"><span class="fw-bold">${escapeHtml(r.orNumber)}</span></td>
        <td>${escapeHtml(r.account)}</td>
        <td>${escapeHtml(r.address)}</td>
        <td class="text-end" style="white-space:nowrap;"><span class="fw-bold">${Number(r.amount || 0).toFixed(2)}</span></td>
        <td>${escapeHtml(r.remarks)}</td>
        <td style="white-space:nowrap;">
          <span class="badge bg-secondary">${escapeHtml(r.source)}</span>
        </td>
        <td style="white-space:nowrap;">
          <button class="btn btn-sm btn-primary js-edit" data-or="${escapeHtml(r.orNumber)}">
            <i class="bi bi-pencil-square"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger ms-1 js-delete" data-or="${escapeHtml(r.orNumber)}">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }
  
  function updateStats(records, summary = { newCount: 0, updatedCount: 0, skippedCount: 0 }) {
    document.getElementById("totalRecords").textContent = records.length;
  
    const total = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    document.getElementById("totalAmount").textContent = total.toFixed(2);
  
    document.getElementById("newCount").textContent = summary.newCount;
    document.getElementById("updatedCount").textContent = summary.updatedCount;
    document.getElementById("skippedCount").textContent = summary.skippedCount;
  }