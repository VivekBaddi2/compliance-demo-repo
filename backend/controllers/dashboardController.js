// controllers/dashboardController.js
import asyncHandler from "express-async-handler";
import CompanySheet from "../schemas/dashboardSchema.js";
import SubSheet from "../schemas/detailedSheetSchema.js"; // used to create/get sub-sheets

// Create sheet
export const createCompanySheet = asyncHandler(async (req, res) => {
  const { companyId } = req.body;

  if (!companyId)
    return res.status(400).json({
      success: false,
      msg: "companyId required",
    });

  // If a single 'default' sheet exists, we still create a new sheet only
  // when explicitly requested via the FY endpoint. This endpoint will create
  // a default sheet if none exists.
  const exists = await CompanySheet.findOne({ companyId, fy: null });
  if (exists) {
    return res.status(200).json({
      success: true,
      msg: "Default sheet already exists",
      data: exists,
    });
  }

  // Create empty sheet with NO heads and NO services
  const newSheet = await CompanySheet.create({
    companyId,
    serviceHeads: {},   // Map initialised empty
    dashboard: [],
  });

  res.status(201).json({
    success: true,
    msg: "Empty sheet created successfully",
    data: newSheet,
  });
});

// Create a new CompanySheet for a specific financial year (e.g., 2025 -> FY 2025-2026)
export const createFYSheet = asyncHandler(async (req, res) => {
  const { companyId, startYear } = req.body;
  if (!companyId || !startYear) return res.status(400).json({ success: false, msg: 'companyId and startYear required' });

  const year = Number(startYear);
  if (isNaN(year)) return res.status(400).json({ success: false, msg: 'Invalid startYear' });

  const fyRange = `${year}-${year + 1}`;

  // If sheet for this FY already exists, return it
  const exists = await CompanySheet.findOne({ companyId, fy: fyRange });
  if (exists) return res.status(200).json({ success: true, msg: 'FY sheet already exists', data: exists });

  // Try to copy serviceHeads from any existing default sheet for the company
  const defaultSheet = await CompanySheet.findOne({ companyId, fy: null });

  // Build serviceHeads map/object to use for new sheet
  let serviceHeadsObj = {};
  if (defaultSheet && defaultSheet.serviceHeads) {
    // convert Mongoose Map to plain object
    if (defaultSheet.serviceHeads instanceof Map || defaultSheet.serviceHeads.constructor?.name === 'MongooseMap') {
      for (const [k, v] of defaultSheet.serviceHeads.entries()) {
        serviceHeadsObj[k] = Array.isArray(v) ? v.slice() : v;
      }
    } else if (typeof defaultSheet.serviceHeads === 'object') {
      serviceHeadsObj = JSON.parse(JSON.stringify(defaultSheet.serviceHeads));
    }
  }

  // Generate months April (3) .. March (14 mod 12) for the FY
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dashboard = [];
  for (let i = 3; i < 15; i++) {
    const m = i % 12;
    const y = year + Math.floor(i / 12);
    const period = `${monthNames[m]} ${y}`;

    // create services object based on serviceHeadsObj
    const servicesObj = {};
    for (const headName of Object.keys(serviceHeadsObj || {})) {
      const servicesList = serviceHeadsObj[headName] || [];
      servicesList.forEach((serviceName) => {
        if (!servicesObj[serviceName]) servicesObj[serviceName] = {};
        // ensure each head key exists
        servicesObj[serviceName][headName] = { symbol: '', notes: '', subSheetId: null };
      });
    }

    dashboard.push({ period, services: servicesObj });
  }

  // Create the new FY sheet. If the DB still has a unique index on `companyId` we
  // may get a duplicate-key error (E11000). In that case return the existing
  // sheet so the frontend can continue to work until the index is removed.
  let newSheet;
  try {
    newSheet = await CompanySheet.create({
      companyId,
      fy: fyRange,
      heading: `FY ${fyRange}`,
      serviceHeads: serviceHeadsObj,
      dashboard,
    });

    return res.status(201).json({ success: true, msg: 'FY sheet created', data: newSheet });
  } catch (err) {
    // Mongo duplicate key error
    if (err && (err.code === 11000 || err.codeName === 'DuplicateKey')) {
      // Try to find a matching FY sheet first, otherwise fall back to any sheet
      const existing = await CompanySheet.findOne({ companyId, fy: fyRange }) || await CompanySheet.findOne({ companyId });
      if (existing) {
        return res.status(200).json({ success: true, msg: 'Existing sheet returned (DB index prevents new creations)', data: existing });
      }
      // If somehow we cannot find an existing sheet, return a helpful error
      return res.status(500).json({ success: false, msg: 'Duplicate key error creating FY sheet and no existing sheet found. Please drop the unique index on companyId in the DB.' });
    }
    // Re-throw other unexpected errors so the asyncHandler can handle them
    throw err;
  }
});

// List all sheets for a company
export const listCompanySheets = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  if (!companyId) return res.status(400).json({ success: false, msg: 'companyId required' });
  const sheets = await CompanySheet.find({ companyId }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: sheets });
});

// Delete a specific company sheet
export const deleteCompanySheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  if (!sheetId) return res.status(400).json({ success: false, msg: 'sheetId required' });
  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ success: false, msg: 'Sheet not found' });
  await CompanySheet.findByIdAndDelete(sheetId);
  res.status(200).json({ success: true, msg: 'Sheet deleted' });
});

// GET /dashboard/sheet/:sheetId
export const getCompanySheetById = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  if (!sheetId) return res.status(400).json({ success: false, msg: 'sheetId required' });
  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ success: false, msg: 'Sheet not found' });
  res.status(200).json({ success: true, data: sheet });
});


// ADD HEAD
export const addHead = asyncHandler(async (req, res) => {
  const { sheetId, headName } = req.body;
  if (!sheetId || !headName)
    return res.status(400).json({ message: "Missing fields" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ message: "Sheet not found" });

  if (sheet.serviceHeads.has(headName)) {
    return res.status(400).json({ message: "Head already exists" });
  }

  // Add the head (as an empty list of services)
  sheet.serviceHeads.set(headName, []);
  sheet.markModified("serviceHeads");

  // If this head represents an aggregated period (Quarterly/Half-Yearly/Yearly)
  // apply automatic row-merge metadata so the UI shows merged rows immediately.
  try {
    await autoMergeHead(sheet, headName);
  } catch (e) {
    console.error('autoMergeHead failed', e);
  }

  await sheet.save();

  res.json({ message: "Head added", data: sheet });
});

// Helper: automatically set mergedRange metadata for a newly added aggregated head
async function autoMergeHead(sheet, headName, servicesFilter) {
  if (!sheet) return;
  const lower = String(headName || "").toLowerCase();
  let mode = null;
  if (lower.includes("quarter")) mode = 'quarterly';
  else if (lower.includes("half")) mode = 'half';
  else if (lower.includes("year")) mode = 'yearly';
  else return; // not an aggregated head

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Which services to apply the merged metadata to
  const servicesList = Array.isArray(servicesFilter) && servicesFilter.length > 0
    ? servicesFilter
    : (sheet.serviceHeads && sheet.serviceHeads.get(headName)) || [];

  if (!servicesList || servicesList.length === 0) return; // nothing to apply

  // Helper to normalize row.services into plain object
  const normalizeRowServices = (row) => {
    let servicesPlain = {};
    if (!row.services) row.services = {};
    if (row.services instanceof Map || row.services.constructor?.name === 'MongooseMap') {
      try {
        for (const [k, v] of row.services.entries()) {
          servicesPlain[k] = v && typeof v.toObject === 'function' ? v.toObject() : JSON.parse(JSON.stringify(v || {}));
        }
      } catch (e) {
        for (const k of row.services.keys()) {
          const v = row.services.get(k);
          servicesPlain[k] = v && typeof v.toObject === 'function' ? v.toObject() : JSON.parse(JSON.stringify(v || {}));
        }
      }
    } else if (typeof row.services === 'object') {
      servicesPlain = { ...row.services };
    }
    return servicesPlain;
  };

  // Group dashboard rows by financial year start (April-based)
  const fyMap = new Map(); // fyStartYear -> array of { period, rowIndex }
  for (let i = 0; i < (sheet.dashboard || []).length; i++) {
    const period = sheet.dashboard[i].period;
    const [month, yearStr] = (period || "").split(" ");
    const mIdx = monthNames.indexOf(month);
    const y = Number(yearStr);
    if (mIdx === -1 || isNaN(y)) continue;
    const fyStart = mIdx >= 3 ? y : y - 1;
    if (!fyMap.has(fyStart)) fyMap.set(fyStart, []);
    fyMap.get(fyStart).push({ period, rowIndex: i });
  }

  // For each FY, build ordered 12-month list (Apr -> Mar) and apply merges
  for (const [fyStart, rows] of fyMap.entries()) {
    // Build ordered months for this FY
    const ordered = [];
    for (let i = 3; i < 15; i++) {
      const m = i % 12;
      const y = fyStart + Math.floor(i / 12);
      ordered.push(`${monthNames[m]} ${y}`);
    }

    let groups = [];
    if (mode === 'quarterly') {
      groups = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]];
    } else if (mode === 'half') {
      groups = [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]];
    } else if (mode === 'yearly') {
      groups = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]];
    }

    for (const grp of groups) {
      const first = ordered[grp[0]];
      const last = ordered[grp[grp.length - 1]];

      // For each service, set mergedRange on the target (first) and clear others
      for (const svc of servicesList) {
        for (let gi = 0; gi < grp.length; gi++) {
          const p = ordered[grp[gi]];
          const rowEntry = sheet.dashboard.findIndex(r => r.period === p);
          if (rowEntry === -1) continue;
          const row = sheet.dashboard[rowEntry];
          const servicesPlain = normalizeRowServices(row);
          if (!servicesPlain[svc]) servicesPlain[svc] = {};
          if (gi === 0) {
            // target: set mergedRange metadata
            servicesPlain[svc][headName] = servicesPlain[svc][headName] || { symbol: "", notes: "", subSheetId: null };
            servicesPlain[svc][headName].mergedRange = { from: first, to: last, count: grp.length };
          } else {
            // source: clear any existing data for this head
            servicesPlain[svc][headName] = { symbol: "", notes: "", subSheetId: null };
            // explicitly remove mergedRange if present
            if (servicesPlain[svc][headName].mergedRange) delete servicesPlain[svc][headName].mergedRange;
          }
          // assign back
          row.services = servicesPlain;
          sheet.markModified(`dashboard.${rowEntry}`);
        }
      }
    }
  }
}


// REMOVE HEAD  (FULLY CORRECTED FOR MAP)

export const removeHead = asyncHandler(async (req, res) => {
  const { sheetId, headType } = req.body;
  console.log(headType, sheetId)
  if (!sheetId || !headType)
    return res
      .status(400)
      .json({ success: false, msg: "sheetId and headType are required" });

  const sheet = await CompanySheet.findById(sheetId);
  console.log(sheet)
  if (!sheet)
    return res.status(404).json({ success: false, msg: "Sheet not found" });

  console.log(sheet.serviceHeads.has(headType))

  // If head not present
  if (!sheet.serviceHeads.has(headType))
    return res
      .status(400)
      .json({ success: false, msg: "Head does not exist" });

  // 1️⃣ Remove from serviceHeads
  sheet.serviceHeads.delete(headType);

  // 2️⃣ Remove data / metadata of this head from every row so old merged metadata doesn't persist
  if (Array.isArray(sheet.dashboard)) {
    for (let ri = 0; ri < sheet.dashboard.length; ri++) {
      const row = sheet.dashboard[ri];
      if (!row || !row.services) continue;

      // Normalize row.services into a plain JS object to handle Map / MongooseMap cases
      let servicesPlain = {};
      if (row.services instanceof Map || row.services.constructor?.name === 'MongooseMap') {
        try {
          for (const [k, v] of row.services.entries()) {
            servicesPlain[k] = v && typeof v.toObject === 'function' ? v.toObject() : JSON.parse(JSON.stringify(v || {}));
          }
        } catch (e) {
          // fallback: try simple iteration
          for (const k of row.services.keys()) {
            const v = row.services.get(k);
            servicesPlain[k] = v && typeof v.toObject === 'function' ? v.toObject() : JSON.parse(JSON.stringify(v || {}));
          }
        }
      } else if (typeof row.services === 'object') {
        servicesPlain = { ...row.services };
      }

      // Remove the headType entry from each service (if present)
      for (const svc of Object.keys(servicesPlain)) {
        if (servicesPlain[svc] && servicesPlain[svc][headType]) {
          delete servicesPlain[svc][headType];
        }
        // If the service entry becomes empty, we leave it; removal of services is handled elsewhere
      }

      // Assign back the plain object so Mongoose persists deletions correctly
      row.services = servicesPlain;
      sheet.markModified(`dashboard.${ri}`);
    }
  }

  await sheet.save();

  res.status(200).json({
    success: true,
    msg: `Head '${headType}' removed successfully`,
    data: sheet,
  });
});

// ADD ROW — FIXED HEAD LOOP
export const addDashboardRow = asyncHandler(async (req, res) => {
  const { sheetId, period } = req.body;
  if (!sheetId || !period)
    return res
      .status(400)
      .json({ success: false, msg: "sheetId and period required" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet)
    return res.status(404).json({ success: false, msg: "Sheet not found" });

  if (sheet.dashboard.some((r) => r.period === period))
    return res
      .status(400)
      .json({ success: false, msg: "Period already exists" });

  // Dynamic heads instead of fixed ["Monthly","Quarterly"...]
  const servicesObj = {};

  for (const [head, serviceList] of sheet.serviceHeads.entries()) {
    serviceList.forEach((serviceName) => {
      if (!servicesObj[serviceName]) servicesObj[serviceName] = {};

      servicesObj[serviceName][head] = {
        symbol: "",
        notes: "",
        subSheetId: null,
      };
    });
  }

  sheet.dashboard.push({ period, services: servicesObj });
  sheet.markModified("dashboard");
  await sheet.save();

  res
    .status(200)
    .json({ success: true, msg: "Row added", data: sheet.dashboard });
});


// ADD SERVICE TO HEAD — already correctly using Map
export const addServiceToHead = asyncHandler(async (req, res) => {
  const { sheetId, headType, serviceName } = req.body;

  if (!sheetId || !headType || !serviceName) {
    return res
      .status(400)
      .json({ success: false, msg: "sheetId, headType, serviceName required" });
  }

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet)
    return res.status(404).json({ success: false, msg: "Sheet not found" });

  if (!sheet.serviceHeads) sheet.serviceHeads = new Map();

  if (!sheet.serviceHeads.has(headType)) {
    return res
      .status(400)
      .json({ success: false, msg: `Head "${headType}" does not exist` });
  }

  const services = sheet.serviceHeads.get(headType);

  if (services.includes(serviceName)) {
    return res
      .status(400)
      .json({ success: false, msg: "Service already exists in this head" });
  }

  services.push(serviceName);
  sheet.serviceHeads.set(headType, services);

  sheet.dashboard.forEach((row) => {
    if (!row.services) row.services = {};

    if (!row.services[serviceName]) {
      const defaultCells = {};
      for (const dynamicHead of sheet.serviceHeads.keys()) {
        defaultCells[dynamicHead] = {
          symbol: "",
          notes: "",
          subSheetId: null,
        };
      }
      row.services[serviceName] = defaultCells;
    } else {
      if (!row.services[serviceName][headType]) {
        row.services[serviceName][headType] = {
          symbol: "",
          notes: "",
          subSheetId: null,
        };
      }
    }
  });

  // Apply auto-merge metadata for aggregated heads (if applicable) for the newly added service
  try {
    await autoMergeHead(sheet, headType, [serviceName]);
  } catch (e) {
    console.error('autoMergeHead (addService) failed', e);
  }

  sheet.markModified("serviceHeads");
  sheet.markModified("dashboard");
  await sheet.save();

  res.status(200).json({
    success: true,
    msg: "Service added successfully",
    data: sheet.serviceHeads,
  });
});


// REMOVE SERVICE FROM HEAD — unchanged (already correct)
export const removeServiceFromHead = asyncHandler(async (req, res) => {
  const { sheetId, headType, serviceName } = req.body;

  if (!sheetId || !headType || !serviceName)
    return res.status(400).json({
      success: false,
      msg: "sheetId, headType, serviceName required",
    });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet)
    return res.status(404).json({ success: false, msg: "Sheet not found" });

  if (!sheet.serviceHeads || !sheet.serviceHeads.has(headType)) {
    return res
      .status(400)
      .json({ success: false, msg: `Head "${headType}" does not exist` });
  }

  const updatedServices = sheet
    .serviceHeads
    .get(headType)
    .filter((s) => s !== serviceName);

  sheet.serviceHeads.set(headType, updatedServices);

  const stillPresentSomewhere = [...sheet.serviceHeads.values()].some((list) =>
    list.includes(serviceName)
  );

  // Iterate rows and update/remove service entries. Handle Map/MongooseMap shapes by
  // normalizing to plain objects so deletions persist in MongoDB.
  if (Array.isArray(sheet.dashboard)) {
    for (let ri = 0; ri < sheet.dashboard.length; ri++) {
      const row = sheet.dashboard[ri];
      if (!row || !row.services) continue;

      // Normalize services into a plain JS object
      let servicesPlain = {};
      if (row.services instanceof Map || row.services.constructor?.name === 'MongooseMap') {
        try {
          for (const [k, v] of row.services.entries()) {
            servicesPlain[k] = v && typeof v.toObject === 'function' ? v.toObject() : JSON.parse(JSON.stringify(v || {}));
          }
        } catch (e) {
          for (const k of row.services.keys()) {
            const v = row.services.get(k);
            servicesPlain[k] = v && typeof v.toObject === 'function' ? v.toObject() : JSON.parse(JSON.stringify(v || {}));
          }
        }
      } else if (typeof row.services === 'object') {
        servicesPlain = { ...row.services };
      }

      if (!servicesPlain[serviceName]) continue;

      if (!stillPresentSomewhere) {
        delete servicesPlain[serviceName];
      } else {
        if (servicesPlain[serviceName] && servicesPlain[serviceName][headType]) {
          servicesPlain[serviceName][headType] = {
            symbol: "",
            notes: "",
            subSheetId: null,
          };
        }
      }

      // assign back and mark modified so Mongoose persists changes
      row.services = servicesPlain;
      sheet.markModified(`dashboard.${ri}`);
    }
  }

  sheet.markModified("serviceHeads");
  sheet.markModified("dashboard");
  await sheet.save();

  res.status(200).json({
    success: true,
    msg: "Service removed from head",
    data: sheet.serviceHeads,
  });
});


export const updateCells = asyncHandler(async (req, res) => {
  const { sheetId, updates } = req.body;

  if (!sheetId || !Array.isArray(updates))
    return res
      .status(400)
      .json({ success: false, msg: "sheetId and updates array required" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) return res.status(404).json({ success: false, msg: "Sheet not found" });

  for (let i = 0; i < updates.length; i++) {
    const u = updates[i];
    const {
      period,
      serviceName,
      headType,
      symbol = "",
      notes = "",
      createSubSheet = false,
      subSheetPayload = {},
    } = u;

    if (!period || !serviceName || !headType) continue;

    const rowIndex = sheet.dashboard.findIndex((r) => r.period === period);
    if (rowIndex === -1) continue;
    const row = sheet.dashboard[rowIndex];

    if (!sheet.serviceHeads.has(headType)) continue;

    // Normalize services into a plain JS object, update, then assign back
    let servicesPlain = {};
    if (row.services && (row.services instanceof Map || row.services.constructor?.name === 'MongooseMap')) {
      for (const [k, v] of row.services.entries()) {
        try {
          servicesPlain[k] = v && typeof v.toObject === 'function' ? v.toObject() : JSON.parse(JSON.stringify(v || {}));
        } catch (e) {
          servicesPlain[k] = v || {};
        }
      }
    } else if (row.services && typeof row.services === 'object') {
      servicesPlain = { ...row.services };
    } else {
      servicesPlain = {};
    }

    if (!servicesPlain[serviceName]) servicesPlain[serviceName] = {};
    if (!servicesPlain[serviceName][headType]) {
      servicesPlain[serviceName][headType] = { symbol: "", notes: "", subSheetId: null };
    }

    servicesPlain[serviceName][headType].symbol = symbol;
    servicesPlain[serviceName][headType].notes = notes;

    servicesPlain[serviceName][headType].updatedAt = new Date();

    // Persist who edited the cell when provided by the client (e.g. super-admin username).
    // If `updatedBy` is explicitly null, remove the field. If undefined, leave as-is.
    if (u.updatedBy !== undefined) {
      if (u.updatedBy === null) {
        delete servicesPlain[serviceName][headType].updatedBy;
      } else {
        servicesPlain[serviceName][headType].updatedBy = u.updatedBy;
      }
    }

    // preserve arbitrary metadata fields if provided in the update payload
    if (u.mergedRange !== undefined) {
      if (u.mergedRange === null) {
        // remove mergedRange metadata
        delete servicesPlain[serviceName][headType].mergedRange;
      } else {
        servicesPlain[serviceName][headType].mergedRange = u.mergedRange;
      }
    }

    // Assign the plain object back to the row so Mongoose persists it correctly
    row.services = servicesPlain;
    sheet.markModified(`dashboard.${rowIndex}`);

    if (createSubSheet) {
      const payload = {
        companyId: sheet.companyId,
        sheetId: sheet._id,
        headType,
        serviceName,
        period,
        ...subSheetPayload,
      };
      const created = await SubSheet.create(payload);
      servicesPlain[serviceName][headType].subSheetId = created._id;
      row.services = servicesPlain;
      sheet.markModified(`dashboard.${rowIndex}`);
    } else if (u.subSheetId) {
      servicesPlain[serviceName][headType].subSheetId = u.subSheetId;
      row.services = servicesPlain;
      sheet.markModified(`dashboard.${rowIndex}`);
    }
  }

  await sheet.save();

  res.status(200).json({ success: true, msg: "Cells updated", data: sheet.dashboard });
});


// GET DASHBOARD
export const getCompanyDashboard = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  if (!companyId)
    return res.status(400).json({ success: false, msg: "companyId required" });

  const sheet = await CompanySheet.findOne({ companyId });
  if (!sheet)
    return res.status(404).json({ success: false, msg: "Sheet not found" });

  res.status(200).json({ success: true, data: sheet });
});


// DELETE ROW
export const deleteDashboardRow = asyncHandler(async (req, res) => {
  const { sheetId, period } = req.params;
  if (!sheetId || !period)
    return res
      .status(400)
      .json({ success: false, msg: "sheetId and period required" });

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet)
    return res.status(404).json({ success: false, msg: "Sheet not found" });

  sheet.dashboard = sheet.dashboard.filter((r) => r.period !== period);
  await sheet.save();

  res
    .status(200)
    .json({ success: true, msg: "Period row deleted", data: sheet.dashboard });
});

// PUT /dashboard/cells/lock
export const lockCell = asyncHandler(async (req, res) => {
  const { sheetId, period, serviceName, headType } = req.body;

  const sheet = await CompanySheet.findById(sheetId);
  if (!sheet) throw new Error("Sheet not found");

  const row = sheet.dashboard.find(r => r.period === period);
  if (!row) throw new Error("Period not found");

  if (!row.services[serviceName]) row.services[serviceName] = {};
  if (!row.services[serviceName][headType]) {
    row.services[serviceName][headType] = { symbol: "", locked: false };
  }

  row.services[serviceName][headType].locked = true;

  await sheet.save();
  res.json({ success: true });
});
