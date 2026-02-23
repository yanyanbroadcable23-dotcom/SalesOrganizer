function exportCSV(records) {
    // Source column excluded (per your request)
    const headers = ["OR", "Account Name", "Address", "Amount", "Remarks"];
    const lines = [headers.join(",")];
  
    for (const r of records) {
      const row = [
        r.orNumber,
        `"${(r.account || "").replace(/"/g, '""')}"`,
        `"${(r.address || "").replace(/"/g, '""')}"`,
        Number(r.amount || 0),
        `"${(r.remarks || "").replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(","));
    }
  
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sales_organizer_v5.csv";
    a.click();
  }
  
  function exportExcel(records) {
    // Source column excluded (per your request)
    const wsData = [
      ["OR", "Account Name", "Address", "Amount", "Remarks"],
      ...records.map(r => [
        r.orNumber,
        r.account,
        r.address,
        Number(r.amount || 0),
        r.remarks
      ]),
    ];
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
  
    // Optional: format column widths
    ws["!cols"] = [
      { wch: 12 }, // OR
      { wch: 28 }, // Account
      { wch: 40 }, // Address
      { wch: 12 }, // Amount
      { wch: 28 }, // Remarks
    ];
  
    XLSX.utils.book_append_sheet(wb, ws, "Consolidated");
    XLSX.writeFile(wb, "sales_organizer_v5.xlsx");
  }