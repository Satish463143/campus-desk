const prisma = require("../../config/db.config");
const { getCache, setCache, clearCache } = require("../../utils/redisCache");

class PeriodService {

  /**
   * Parse "HH:MM" string + durationMinutes → { startTime: Date, endTime: Date }
   * Stored on 1970-01-01 so comparisons are time-only.
   */
  _resolveTimeBounds(startTimeStr, durationMinutes) {
    const [hh, mm] = startTimeStr.split(":").map(Number);
    const startTotalMinutes = hh * 60 + mm;
    const endTotalMinutes   = startTotalMinutes + parseInt(durationMinutes, 10);

    if (endTotalMinutes > 1440) {
      throw { status: 400, message: "Period exceeds midnight (24:00). Reduce start time or duration." };
    }

    const startTime = new Date("1970-01-01T00:00:00Z");
    startTime.setUTCMinutes(startTotalMinutes);

    const endTime = new Date("1970-01-01T00:00:00Z");
    endTime.setUTCMinutes(endTotalMinutes);

    return { startTime, endTime, durationMinutes };
  }

  /** Convert a stored Date back to "HH:MM" string */
  _dateToTimeStr(date) {
    const d = new Date(date);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  /** Enrich a raw period record with human-friendly fields */
  _format(period) {
    if (!period) return null;
    const start = new Date(period.startTime);
    const end   = new Date(period.endTime);
    const durationMinutes =
      (end.getUTCHours() * 60 + end.getUTCMinutes()) -
      (start.getUTCHours() * 60 + start.getUTCMinutes());

    return {
      ...period,
      startTime:       this._dateToTimeStr(period.startTime),
      endTime:         this._dateToTimeStr(period.endTime),
      durationMinutes,
    };
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  async createPeriod(data) {
    const {
      schoolId,
      academicYearId,
      name,
      periodNumber,
      startTime: startTimeStr,
      durationMinutes,
      isBreak  = false,
      isActive = true,
    } = data;

    // Validate academic year belongs to school
    const academicYear = await prisma.academicYear.findFirst({
      where: { id: academicYearId, schoolId },
    });
    if (!academicYear) throw { status: 404, message: "Academic year not found" };

    // Prevent duplicate period number in same school/year
    const duplicate = await prisma.period.findFirst({
      where: { schoolId, academicYearId, periodNumber },
    });
    if (duplicate) throw { status: 409, message: "Period number already exists for this academic year" };

    // Resolve times & check overlap
    const { startTime, endTime } = this._resolveTimeBounds(startTimeStr, durationMinutes);

    const overlapping = await prisma.period.findFirst({
      where: {
        schoolId,
        academicYearId,
        startTime: { lt: endTime },
        endTime:   { gt: startTime },
      },
    });
    if (overlapping) {
      throw {
        status: 409,
        message: `Period overlaps with "${overlapping.name}" (${this._dateToTimeStr(overlapping.startTime)} – ${this._dateToTimeStr(overlapping.endTime)})`,
      };
    }

    const period = await prisma.period.create({
      data: { schoolId, academicYearId, name, periodNumber, startTime, endTime, isBreak, isActive },
    });

    await clearCache(`periods_list_s${schoolId}*`);
    return this._format(period);
  }

  async getPeriods({ schoolId, academicYearId, skip = 0, limit = 20, search = "" }) {
    const where = { schoolId, academicYearId };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [periods, count] = await Promise.all([
      prisma.period.findMany({
        where,
        orderBy: { periodNumber: "asc" },
        skip,
        take: limit,
      }),
      prisma.period.count({ where }),
    ]);

    return { data: periods.map(p => this._format(p)), count };
  }

  async getPeriodById({ id, schoolId }) {
    const period = await prisma.period.findFirst({ where: { id, schoolId } });
    if (!period) throw { status: 404, message: "Period not found" };
    return this._format(period);
  }

  async updatePeriod({ id, schoolId, data }) {
    const period = await prisma.period.findFirst({ where: { id, schoolId } });
    if (!period) throw { status: 404, message: "Period not found" };

    const { name, periodNumber, startTime: startTimeStr, durationMinutes, isBreak, isActive } = data;
    const updateData = {};

    // Check for duplicate period number
    if (periodNumber !== undefined && periodNumber !== period.periodNumber) {
      const duplicate = await prisma.period.findFirst({
        where: { schoolId, academicYearId: period.academicYearId, periodNumber },
      });
      if (duplicate) throw { status: 409, message: "Period number already exists for this academic year" };
      updateData.periodNumber = periodNumber;
    }

    // Recalculate times if either startTime or duration changed
    const newStartStr       = startTimeStr       ?? this._dateToTimeStr(period.startTime);
    const existingDuration  =
      (new Date(period.endTime).getUTCHours() * 60 + new Date(period.endTime).getUTCMinutes()) -
      (new Date(period.startTime).getUTCHours() * 60 + new Date(period.startTime).getUTCMinutes());
    const newDuration       = durationMinutes ?? existingDuration;

    if (startTimeStr !== undefined || durationMinutes !== undefined) {
      const { startTime, endTime } = this._resolveTimeBounds(newStartStr, newDuration);

      const overlapping = await prisma.period.findFirst({
        where: {
          schoolId,
          academicYearId: period.academicYearId,
          id:             { not: id },
          startTime:      { lt: endTime },
          endTime:        { gt: startTime },
        },
      });
      if (overlapping) {
        throw {
          status: 409,
          message: `Period overlaps with "${overlapping.name}" (${this._dateToTimeStr(overlapping.startTime)} – ${this._dateToTimeStr(overlapping.endTime)})`,
        };
      }

      updateData.startTime = startTime;
      updateData.endTime   = endTime;
    }

    if (name     !== undefined) updateData.name     = name;
    if (isBreak  !== undefined) updateData.isBreak  = isBreak;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.period.update({ where: { id }, data: updateData });
    await clearCache(`periods_list_s${schoolId}*`);
    return this._format(updated);
  }

  async deletePeriod({ id, schoolId }) {
    const period = await prisma.period.findFirst({ where: { id, schoolId } });
    if (!period) throw { status: 404, message: "Period not found" };

    const linkedTimetables = await prisma.timetable.count({ where: { periodId: id } });
    if (linkedTimetables > 0) {
      throw { status: 400, message: "Cannot delete period — it is linked to timetable entries" };
    }

    await prisma.period.delete({ where: { id } });
    await clearCache(`periods_list_s${schoolId}*`);
    return { id };
  }
}

module.exports = new PeriodService();
