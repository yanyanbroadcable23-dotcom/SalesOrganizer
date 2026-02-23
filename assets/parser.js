function detectFileType(filename) {
    const name = filename.toLowerCase();
    if (name.includes("m1")) return "M1";
    if (name.includes("m2")) return "M2";
    if (name.includes("cable")) return "CABLE";
    return "UNKNOWN";
  }
  
  function cleanAmount(value) {
    if (value === null || value === undefined) return 0;
    const n = String(value).replace(/,/g, "").trim();
    const num = Number(n);
    return Number.isFinite(num) ? num : 0;
  }
  
  function parseM1Row(row) {
    // Columns: C=2, F=5, G=6, J=9 (0-based indices)
    const account = (row[2] ?? "").toString().trim();
    const amount = cleanAmount(row[5]);
    const colG = (row[6] ?? "").toString().trim();
    const address = (row[9] ?? "").toString().trim();
  
    // OR format: "30291 FEB 2026"
    // Extract number BEFORE date; date part becomes remarks
    const match = colG.match(/^(\d+)\s+(.*)$/);
    if (!match) return null;
  
    const orNumber = match[1].trim();
    const remarks = match[2].trim();
  
    if (!orNumber || !/^\d+$/.test(orNumber)) return null;
  
    return { orNumber, account, address, amount, remarks, source: "M1" };
  }
  
  function parseM2Row(row) {
    // OR=K(10), Account=B(1), Address=C(2), Amount=I(8), Remarks=L(11)
    const rawOR = (row[10] ?? "").toString().trim();
    // If contains letters/symbols -> skip entire row
    if (!rawOR || /[^0-9]/.test(rawOR)) return null;
  
    const orNumber = rawOR;
    const account = (row[1] ?? "").toString().trim();
    const address = (row[2] ?? "").toString().trim();
    const amount = cleanAmount(row[8]);
    const remarks = (row[11] ?? "").toString().trim();
  
    return { orNumber, account, address, amount, remarks, source: "M2" };
  }
  
  function parseCableRow(row) {
    // OR=D(3), Account=A(0), Address=B(1), Amount=F(5), Remarks=C(2)
    const rawOR = (row[3] ?? "").toString().trim();
    if (!rawOR || !/^\d+$/.test(rawOR)) return null;
  
    const orNumber = rawOR;
    const account = (row[0] ?? "").toString().trim();
    const address = (row[1] ?? "").toString().trim();
    const amount = cleanAmount(row[5]);
    const remarks = (row[2] ?? "").toString().trim();
  
    return { orNumber, account, address, amount, remarks, source: "CABLE" };
  }
  
  function parseRowByType(fileType, row) {
    if (fileType === "M1") return parseM1Row(row);
    if (fileType === "M2") return parseM2Row(row);
    if (fileType === "CABLE") return parseCableRow(row);
    return null;
  }