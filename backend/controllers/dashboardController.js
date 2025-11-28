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

  // Check if sheet already exists
  const exists = await CompanySheet.findOne({ companyId });
  if (exists) {
    return res.status(200).json({
      success: true,
      msg: "Sheet already exists",
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

  sheet.serviceHeads.set(headName, []);
  sheet.markModified("serviceHeads");
  await sheet.save();

  res.json({ message: "Head added", data: sheet });
});


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
