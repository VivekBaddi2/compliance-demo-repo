// controllers/dashboardController.js
import asyncHandler from "express-async-handler";
import CompanySheet from "../schemas/dashboardSchema.js";
import SubSheet from "../schemas/detailedSheetSchema.js"; // used to create/get sub-sheets

// Create sheet
export const createCompanySheet = asyncHandler(async (req, res) => {
  const { companyId } = req.body;
  if (!companyId) return res.status(400).json({ success: false, msg: "companyId required" });

  const exists = await CompanySheet.findOne({ companyId });
  if (exists) return res.status(200).json({ success: true, msg: "Sheet already exists", data: exists });

  const newSheet = await CompanySheet.create({
    companyId,
    serviceHeads: { Monthly: [], Quarterly: [], HalfYearly: [], Yearly: [] },
    dashboard: [],
  });

  res.status(201).json({ success: true, msg: "Sheet created", data: newSheet });
});

// Add new period row (month/quarter/half/year)
export const addDashboardRow = asyncHandler(async (req, res) => {
  const { sheetId, period } = req.body;
  if (!sheetId || !period) return res.status(400).json({ success: false, msg: "sheetId and period required" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ success: false, msg: "Sheet not found" });

  if (sheet.dashboard.some(r => r.period === period)) return res.status(400).json({ success: false, msg: "Period already exists" });

  // Build initial services object with existing serviceHeads
  const servicesObj = {};
  ["Monthly", "Quarterly", "HalfYearly", "Yearly"].forEach(head => {
    (sheet.serviceHeads[head] || []).forEach(serviceName => {
      if (!servicesObj[serviceName]) servicesObj[serviceName] = {
        Monthly: { symbol: "", notes: "", subSheetId: null },
        Quarterly: { symbol: "", notes: "", subSheetId: null },
        HalfYearly: { symbol: "", notes: "", subSheetId: null },
        Yearly: { symbol: "", notes: "", subSheetId: null }
      };
    });
  });

  sheet.dashboard.push({ period, services: servicesObj });
  sheet.markModified("dashboard");
  await sheet.save();

  res.status(200).json({ success: true, msg: "Row added", data: sheet.dashboard });
});

// Add service under a head (e.g., add "GST" under Monthly)
export const addServiceToHead = asyncHandler(async (req, res) => {
  const { sheetId, headType, serviceName } = req.body;
  if (!sheetId || !headType || !serviceName) return res.status(400).json({ success: false, msg: "sheetId, headType, serviceName required" });

  const head = headType; // expect exact "Monthly"|"Quarterly"|"HalfYearly"|"Yearly"
  if (!["Monthly","Quarterly","HalfYearly","Yearly"].includes(head)) return res.status(400).json({ success: false, msg: "Invalid headType" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ success: false, msg: "Sheet not found" });

  if (!Array.isArray(sheet.serviceHeads[head])) sheet.serviceHeads[head] = [];
  if (sheet.serviceHeads[head].includes(serviceName)) return res.status(400).json({ success: false, msg: "Service exists" });

  sheet.serviceHeads[head].push(serviceName);

  // Ensure every existing dashboard row has this service with default cells
  sheet.dashboard.forEach(row => {
    if (!row.services || typeof row.services !== "object") row.services = {};
    if (!row.services[serviceName]) {
      row.services[serviceName] = {
        Monthly: { symbol: "", notes: "", subSheetId: null },
        Quarterly: { symbol: "", notes: "", subSheetId: null },
        HalfYearly: { symbol: "", notes: "", subSheetId: null },
        Yearly: { symbol: "", notes: "", subSheetId: null },
      };
    }
  });

  sheet.markModified("serviceHeads");
  sheet.markModified("dashboard");
  await sheet.save();

  res.status(200).json({ success: true, msg: "Service added", data: sheet.serviceHeads });
});

// Remove a service entirely from a head (and clear from rows)
export const removeServiceFromHead = asyncHandler(async (req, res) => {
  const { sheetId, headType, serviceName } = req.body;
  if (!sheetId || !headType || !serviceName) return res.status(400).json({ success: false, msg: "sheetId, headType, serviceName required" });

  const head = headType;
  if (!["Monthly","Quarterly","HalfYearly","Yearly"].includes(head)) return res.status(400).json({ success: false, msg: "Invalid headType" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ success: false, msg: "Sheet not found" });

  sheet.serviceHeads[head] = (sheet.serviceHeads[head] || []).filter(s => s !== serviceName);

  sheet.dashboard.forEach(row => {
    if (!row.services || typeof row.services !== "object") return;
    if (row.services[serviceName]) {
      // remove the whole service entry if it no longer belongs to any head
      // but safer: delete the service only if it's not present in any head arrays
      const presentElsewhere = ["Monthly","Quarterly","HalfYearly","Yearly"].some(h => (sheet.serviceHeads[h] || []).includes(serviceName));
      if (!presentElsewhere) {
        delete row.services[serviceName];
      } else {
        // else clear only this head cell
        row.services[serviceName][head] = { symbol: "", notes: "", subSheetId: null };
      }
    }
  });

  sheet.markModified("serviceHeads");
  sheet.markModified("dashboard");
  await sheet.save();

  res.status(200).json({ success: true, msg: "Service removed", data: sheet.serviceHeads });
});

// Update a single cell (or multiple cells) - payload supports batch updates
// updates: [{ period, serviceName, headType, symbol, notes, createSubSheet: boolean }]
export const updateCells = asyncHandler(async (req, res) => {
  const { sheetId, updates } = req.body;
  if (!sheetId || !Array.isArray(updates)) return res.status(400).json({ success: false, msg: "sheetId and updates array required" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ success: false, msg: "Sheet not found" });

  for (const u of updates) {
    const { period, serviceName, headType, symbol = "", notes = "", createSubSheet = false, subSheetPayload = {} } = u;
    if (!period || !serviceName || !headType) continue;
    const row = sheet.dashboard.find(r => r.period === period);
    if (!row) continue;

    if (!row.services || typeof row.services !== "object") row.services = {};
    if (!row.services[serviceName]) {
      row.services[serviceName] = {
        Monthly: { symbol: "", notes: "", subSheetId: null },
        Quarterly: { symbol: "", notes: "", subSheetId: null },
        HalfYearly: { symbol: "", notes: "", subSheetId: null },
        Yearly: { symbol: "", notes: "", subSheetId: null },
      };
    }

    // validate head
    if (!["Monthly","Quarterly","HalfYearly","Yearly"].includes(headType)) continue;

    row.services[serviceName][headType].symbol = symbol;
    row.services[serviceName][headType].notes = notes;

    // Optionally create or update a SubSheet and store its id
    if (createSubSheet) {
      // create a sub-sheet document linking to this sheet, period, head and service
      const payload = {
        companyId: sheet.companyId,
        sheetId: sheet._id,
        headType,
        serviceName,
        period,
        ...subSheetPayload
      };
      const created = await SubSheet.create(payload);
      row.services[serviceName][headType].subSheetId = created._id;
    } else if (u.subSheetId) {
      // allow front-end to explicitly provide subSheetId if it already exists
      row.services[serviceName][headType].subSheetId = u.subSheetId;
    }
  }

  sheet.markModified("dashboard");
  await sheet.save();

  res.status(200).json({ success: true, msg: "Cells updated", data: sheet.dashboard });
});

// Get full dashboard by companyId
export const getCompanyDashboard = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  if (!companyId) return res.status(400).json({ success: false, msg: "companyId required" });

  const sheet = await CompanySheet.findOne({ companyId });
  if (!sheet) return res.status(404).json({ success: false, msg: "Sheet not found" });

  res.status(200).json({ success: true, data: sheet });
});


// DELETE /dashboard/row/:sheetId/:period
export const deleteDashboardRow = asyncHandler(async (req, res) => {
  const { sheetId, period } = req.params;
  if (!sheetId || !period) return res.status(400).json({ success: false, msg: "sheetId and period required" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ success: false, msg: "Sheet not found" });

  sheet.dashboard = sheet.dashboard.filter(r => r.period !== period);
  await sheet.save();

  res.status(200).json({ success: true, msg: "Period row deleted", data: sheet.dashboard });
});
