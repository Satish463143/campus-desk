/**
 * FILE: bulkUpload.service.js
 * LOCATION: /src/module/bulkUpload/bulkUpload.service.js
 *
 * Parses multi-sheet Excel / single-sheet CSV bulk student files.
 * Each row is handed to admissionService.create() so every imported student:
 *   1. Gets an Admission record (status = "pending")
 *   2. Gets a StudentProfile (academicStatus = "migration")
 *   3. Gets a User account (role = student)
 *   4. Gets a ParentProfile linked to the student
 *   5. Appears in BOTH the Admissions list AND the Students list immediately
 *
 * Validation is intentionally loose — missing optional fields get sensible
 * defaults; only truly unrecoverable rows (e.g. DB constraint violations)
 * are counted as errors.
 */

"use strict";

const XLSX = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const admissionService = require("../admission/admission.service");

// ─── tiny helpers ─────────────────────────────────────────────────────────────

const safe     = (v) => (v !== undefined && v !== null && String(v).trim() !== "" ? String(v).trim() : null);
const safeDate = (v) => { const d = new Date(v); return v && !isNaN(d) ? d : null; };
const safeLow  = (v) => safe(v)?.toLowerCase() ?? null;
const safeNum  = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };

/** Strip the trailing * that Excel headers use for required markers */
const norm = (h) => String(h).replace(/\*$/, "").trim();

/** Convert a worksheet to plain objects with normalised keys.
 *  @param {number} [headerRow=0] – 0-based row index that contains column names.
 *         Rows above it (section labels like "Student Info") are skipped. */
function sheetRows(wb, name, headerRow = 0) {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: null, raw: false, range: headerRow }).map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) out[norm(k)] = v;
    return out;
  });
}

/** Known section labels used as category headers above the actual column names */
const SECTION_LABELS = ["student info", "address", "parents", "background", "fees & declaration", "fees", "declaration", "family info"];

/**
 * Detect if the first row of a worksheet contains section labels rather than
 * actual column names.  Section-label rows typically have very few non-empty
 * cells (merged headers spanning many columns) whose values match known labels.
 */
function detectHeaderRow(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return 0;
  const firstRow = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false, range: 0 })[0];
  if (!firstRow) return 0;
  const nonEmpty = firstRow.filter((v) => v !== null && String(v).trim() !== "");
  const matchesSection = nonEmpty.some((v) => SECTION_LABELS.includes(String(v).trim().toLowerCase()));
  // If the first row has section-like labels, the actual headers are in the next row
  return matchesSection ? 1 : 0;
}

/** Simple appNo generator used when the row doesn't supply one */
function genAppNo() {
  return `APP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

// ─── service ──────────────────────────────────────────────────────────────────

class BulkUploadService {
  /**
   * processFile(buffer, mimetype, schoolId)
   * → { successCount, errorCount, errors[] }
   */
  async processFile(buffer, mimetype, schoolId) {
    // ── 1. Parse workbook ─────────────────────────────────────────────────────
    const wb = XLSX.read(buffer, { type: "buffer", raw: false });

    // ── 2. Decide template vs flat ────────────────────────────────────────────
    const TEMPLATE_SHEETS = ["Student Info", "Address", "Parents", "Background", "Fees & Declaration"];
    const isMultiSheet = TEMPLATE_SHEETS.some((s) => wb.SheetNames.includes(s));

    let rows;
    if (isMultiSheet) {
      // Legacy multi-sheet template: one sheet per section
      rows = this._mergeTemplate(wb);
    } else {
      // Single-sheet format: may have section-label row above actual headers
      const headerRow = detectHeaderRow(wb, wb.SheetNames[0]);
      rows = sheetRows(wb, wb.SheetNames[0], headerRow);
    }

    if (!rows.length) {
      return { successCount: 0, errorCount: 0, errors: [], message: "No data rows found." };
    }

    // ── 3. Process each row ───────────────────────────────────────────────────
    let successCount = 0;
    let errorCount   = 0;
    let skippedCount = 0;
    const errors     = [];
    const skipped    = [];

    // Keywords in error messages that mean the row already exists — treat as a
    // skip (not a hard failure) so re-uploading the same file is idempotent.
    const DUPLICATE_KEYWORDS = [
      "already exists",
      "unique constraint",
      "duplicate",
      "p2002",
      "unique_violation",
    ];
    const isDuplicate = (err) => {
      const msg = (err?.message ?? err?.code ?? "").toLowerCase();
      return DUPLICATE_KEYWORDS.some((kw) => msg.includes(kw));
    };

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowNum = i + 2; // header = row 1

      // skip entirely empty rows
      if (!Object.values(row).some((v) => v !== null && v !== "")) continue;

      try {
        const payload = this._buildPayload(row);
        await admissionService.create(payload, schoolId);
        successCount++;
      } catch (err) {
        const rowName = `${safe(row.firstName) ?? "?"}${safe(row.surname) ? " " + safe(row.surname) : ""}`.trim();
        // Extract the most useful error message from various error shapes
        const errMsg = err?.message
          ?? err?.meta?.message
          ?? (err?.code ? `DB error ${err.code}` : null)
          ?? JSON.stringify(err);
        console.error(`[BulkUpload] Row ${rowNum} (${rowName}) failed:`, errMsg);
        if (isDuplicate(err)) {
          skippedCount++;
          skipped.push({
            row: rowNum,
            name: rowName,
            reason: "Already imported — student with this email or phone already exists.",
          });
        } else {
          errorCount++;
          errors.push({
            row: rowNum,
            name: rowName,
            error: errMsg,
          });
        }
      }
    }

    return { successCount, errorCount, skippedCount, errors, skipped };
  }

  // ─── Merge multi-sheet template rows by index ─────────────────────────────
  _mergeTemplate(wb) {
    const si  = sheetRows(wb, "Student Info");
    if (!si.length) return [];
    const addr = sheetRows(wb, "Address");
    const par  = sheetRows(wb, "Parents");
    const bg   = sheetRows(wb, "Background");
    const fee  = sheetRows(wb, "Fees & Declaration");
    return si.map((row, i) => ({
      ...row,
      ...(addr[i] ?? {}),
      ...(par[i]  ?? {}),
      ...(bg[i]   ?? {}),
      ...(fee[i]  ?? {}),
    }));
  }

  // ─── Build the payload that admissionService.create() expects ─────────────
  _buildPayload(row) {
    // Required minimums — use placeholders so loose validation passes
    const firstName = safe(row.firstName) ?? safe(row["First Name"]) ?? "Unknown";
    const surname   = safe(row.surname)   ?? safe(row["Surname"])    ?? "Unknown";
    const email     = safe(row.email)     ?? safe(row["Email"])      ?? `bulk_${uuidv4().slice(0,8)}@placeholder.local`;
    const phone     = safe(row.phone)     ?? safe(row["Phone"])      ?? "0000000000";

    const rawGender = safeLow(row.gender) ?? safeLow(row["Gender"]);
    const gender    = ["male", "female", "other"].includes(rawGender ?? "") ? rawGender : "other";

    // ── address ───────────────────────────────────────────────────────────────
    const address = {
      country:          safe(row.country)         ?? "Nepal",
      province:         safe(row.province)        ?? "",
      district:         safe(row.district)        ?? "",
      municipality:     safe(row.municipality)    ?? null,
      wardNo:           safe(row.wardNo)          ?? null,
      tole:             safe(row.tole)            ?? null,
      houseNo:          safe(row.houseNo)         ?? null,
      postCode:         safe(row.postCode)        ?? null,
      fullAddress:      safe(row.fullAddress)     ?? "",
      isTemporarySame:  row.isTemporarySame === "true" || row.isTemporarySame === true,
      tempProvince:     safe(row.tempProvince)    ?? null,
      tempDistrict:     safe(row.tempDistrict)    ?? null,
      tempMunicipality: safe(row.tempMunicipality)?? null,
      tempWardNo:       safe(row.tempWardNo)      ?? null,
      tempTole:         safe(row.tempTole)        ?? null,
      tempHouseNo:      safe(row.tempHouseNo)     ?? null,
      tempPostCode:     safe(row.tempPostCode)    ?? null,
    };

    // ── parents ───────────────────────────────────────────────────────────────
    const father = {
      name:          safe(row.fatherName)          ?? null,
      email:         safe(row.fatherEmail)         ?? null,
      phone:         safe(row.fatherPhone)         ?? null,
      phoneCode:     safe(row.fatherPhoneCode)     ?? null,
      qualification: safe(row.fatherQualification) ?? null,
      occupation:    safe(row.fatherOccupation)    ?? null,
      organisation:  safe(row.fatherOrganisation)  ?? null,
    };

    const mother = {
      name:          safe(row.motherName)          ?? null,
      email:         safe(row.motherEmail)         ?? null,
      phone:         safe(row.motherPhone)         ?? null,
      phoneCode:     safe(row.motherPhoneCode)     ?? null,
      qualification: safe(row.motherQualification) ?? null,
      occupation:    safe(row.motherOccupation)    ?? null,
      organisation:  safe(row.motherOrganisation)  ?? null,
    };

    const guardian = {
      name:          safe(row.guardianName)          ?? null,
      email:         safe(row.guardianEmail)         ?? null,
      phone:         safe(row.guardianPhone)         ?? null,
      phoneCode:     safe(row.guardianPhoneCode)     ?? null,
      relation:      safe(row.guardianRelation)      ?? null,
      qualification: safe(row.guardianQualification) ?? null,
      occupation:    safe(row.guardianOccupation)    ?? null,
      organisation:  safe(row.guardianOrganisation)  ?? null,
    };

    // Determine emergency contact — fall back gracefully
    const rawEC = safe(row.emergencyContact);
    const emergencyContact =
      ["father","mother","guardian"].includes(rawEC ?? "")
        ? rawEC
        : father.name && father.phone ? "father"
        : mother.name && mother.phone ? "mother"
        : "father";

    // ── Read the academicStatus column from Excel (mandatory for migration) ──
    const rawStatus = safeLow(row.academicStatus) ?? safeLow(row["academicStatus"]) ?? safeLow(row.status) ?? safeLow(row["Status"]) ?? "active";
    const VALID_STATUSES = ["active", "inactive", "graduated", "dropped", "transferred"];
    const originalStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : "active";

    // ── student extras ────────────────────────────────────────────────────────
    const studentInfo = {
      nameAtHome:     safe(row.nameAtHome)     ?? null,
      nationality:    safe(row.nationality)    ?? null,
      religion:       safe(row.religion)       ?? null,
      timeBatch:      safe(row.timeBatch)      ?? null,
      languageAtHome: safe(row.languageAtHome) ?? null,
      languageOther:  safe(row.languageOther)  ?? null,
      academicYearId: safe(row.academicYearId) ?? null,
      academicStatus: "migration",
      inactiveDate:   safeDate(row.inactiveDate),
      // Migration tracking fields
      isMigrated:      true,
      migrationStatus: "pending",
      originalStatus:  originalStatus,
    };

    // ── background ────────────────────────────────────────────────────────────
    const background = {
      hasPreviousSchool:   safe(row.hasPreviousSchool)   ?? null,
      previousSchool:      safe(row.previousSchool)      ?? null,
      previousClass:       safe(row.previousClass)       ?? null,
      previousYear:        safe(row.previousYear)        ?? null,
      kinAtSchool:         safe(row.kinAtSchool)         ?? null,
      kinName:             safe(row.kinName)             ?? null,
      kinClass:            safe(row.kinClass)            ?? null,
      siblings:            safe(row.siblings)            ?? null,
      ailments:            safe(row.ailments)            ?? null,
      allergies:           safe(row.allergies)           ?? null,
      surgery:             safe(row.surgery)             ?? null,
      vaccinations:        safe(row.vaccinations)        ?? null,
      medications:         safe(row.medications)         ?? null,
      phobias:             safe(row.phobias)             ?? null,
      specialInstructions: safe(row.specialInstructions) ?? null,
    };

    // ── fees ──────────────────────────────────────────────────────────────────
    const fees = {
      registrationFee: safeNum(row.registrationFee),
      annualCharges:   safeNum(row.annualCharges),
      tuitionFee:      safeNum(row.tuitionFee),
      uniformFee:      safeNum(row.uniformFee),
      stationery:      safeNum(row.stationery),
      eca:             safeNum(row.eca),
      deposit:         safeNum(row.deposit),
      transportation:  safeNum(row.transportation),
    };

    // ── final payload ─────────────────────────────────────────────────────────
    return {
      firstName,
      surname,
      email,
      phone,
      gender,
      dateOfBirth:      safeDate(row.dateOfBirth ?? row["Date of Birth"]),
      bloodGroup:       safe(row.bloodGroup)      ?? null,
      admissionNumber:  safe(row.admissionNumber) ?? null,
      appNo:            safe(row.appNo)           ?? genAppNo(),
      dateOfAdmission:  safeDate(row.dateOfAdmission ?? row["Date of Admission"]),
      className:        safe(row.classId ?? row.className ?? row["Class"]) ?? "",
      // academicStatus "migration" means the student was bulk-uploaded (continuing from last year)
      academicStatus:   "migration",
      status:           "pending",

      studentInfo,
      address,
      father:   father.name   ? father   : null,
      mother:   mother.name   ? mother   : null,
      guardian: guardian.name ? guardian : null,
      familyInfo: {
        maritalStatus:    safe(row.maritalStatus)  ?? null,
        custodyHolder:    safe(row.custodyHolder)  ?? null,
        emergencyContact,
      },
      background,
      fees,
      declarationSigned:    row.declarationSigned === "true" || row.declarationSigned === true || false,
      // Tell admissionService to skip the parent-phone uniqueness check
      // because bulk imports often share parent phones across siblings
      skipParentPhoneCheck: true,
    };
  }
}

module.exports = new BulkUploadService();