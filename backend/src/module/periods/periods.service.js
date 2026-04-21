const prisma = require("../../config/db.config");
const { getCache, setCache, clearCache } = require("../../utils/redisCache");

class PeriodService {

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Parse "HH:MM" startTime + durationMinutes → { startTime, endTime } as "HH:MM" strings.
   * String comparison on HH:MM is lexicographically correct for 24-hour ordering.
   */
  _resolveTimeBounds(startTimeStr, durationMinutes) {
    const [hh, mm] = startTimeStr.split(":").map(Number);
    const startTotal = hh * 60 + mm;
    const endTotal   = startTotal + parseInt(durationMinutes, 10);

    if (endTotal > 1440) {
      throw { status: 400, message: "Period exceeds midnight (24:00). Reduce start time or duration." };
    }

    const endHH = String(Math.floor(endTotal / 60)).padStart(2, "0");
    const endMM = String(endTotal % 60).padStart(2, "0");

    return {
      startTime: startTimeStr.slice(0, 5),  // ensure "HH:MM" (no seconds)
      endTime:   `${endHH}:${endMM}`,
    };
  }

  /**
   * Compute durationMinutes from two "HH:MM" strings.
   */
  _calcDuration(startStr, endStr) {
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }

  /**
   * Enrich a raw period record with durationMinutes derived from stored strings.
   */
  _format(period) {
    if (!period) return null;
    const startTime = period.startTime?.slice(0, 5) ?? "";
    const endTime   = period.endTime?.slice(0, 5)   ?? "";
    return {
      ...period,
      startTime,
      endTime,
      durationMinutes: this._calcDuration(startTime, endTime),
    };
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

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
    if (!academicYear) throw { status: 404, message: "Academic year not found." };

    // Prevent duplicate period number in same school/year
    const duplicate = await prisma.period.findFirst({
      where: { schoolId, academicYearId, periodNumber },
    });
    if (duplicate) throw { status: 409, message: "Period number already exists for this academic year." };

    // Resolve HH:MM strings and check overlap
    const { startTime, endTime } = this._resolveTimeBounds(startTimeStr, durationMinutes);

    // Overlap: existing.startTime < newEndTime  AND  existing.endTime > newStartTime
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
        message: `Period overlaps with "${overlapping.name}" (${overlapping.startTime} – ${overlapping.endTime})`,
      };
    }

    const period = await prisma.period.create({
      data: { schoolId, academicYearId, name, periodNumber, startTime, endTime, isBreak, isActive },
    });

    await clearCache(`periods_list_s${schoolId}*`);
    return this._format(period);
  }

  async getPeriods({ schoolId, academicYearId, skip = 0, limit = 20, search = "" }) {
    const where = { schoolId };
    if (academicYearId) where.academicYearId = academicYearId;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [periods, count] = await Promise.all([
      prisma.period.findMany({ where, orderBy: { periodNumber: "asc" }, skip, take: limit }),
      prisma.period.count({ where }),
    ]);

    return { data: periods.map(p => this._format(p)), count };
  }

  async getPeriodById({ id, schoolId }) {
    const period = await prisma.period.findFirst({ where: { id, schoolId } });
    if (!period) throw { status: 404, message: "Period not found." };
    return this._format(period);
  }

  async updatePeriod({ id, schoolId, data }) {
    const period = await prisma.period.findFirst({ where: { id, schoolId } });
    if (!period) throw { status: 404, message: "Period not found." };

    const { name, periodNumber, startTime: startTimeStr, durationMinutes, isBreak, isActive } = data;
    const updateData = {};

    // Check for duplicate period number
    if (periodNumber !== undefined && periodNumber !== period.periodNumber) {
      const duplicate = await prisma.period.findFirst({
        where: { schoolId, academicYearId: period.academicYearId, periodNumber },
      });
      if (duplicate) throw { status: 409, message: "Period number already exists for this academic year." };
      updateData.periodNumber = periodNumber;
    }

    // Recalculate times if either startTime or duration changed
    if (startTimeStr !== undefined || durationMinutes !== undefined) {
      // Use existing stored HH:MM strings as fallback — no Date conversion needed
      const existingDuration = this._calcDuration(
        period.startTime.slice(0, 5),
        period.endTime.slice(0, 5)
      );
      const newStartStr = startTimeStr ?? period.startTime.slice(0, 5);
      const newDuration = durationMinutes ?? existingDuration;

      const { startTime, endTime } = this._resolveTimeBounds(newStartStr, newDuration);

      const overlapping = await prisma.period.findFirst({
        where: {
          schoolId,
          academicYearId: period.academicYearId,
          id:        { not: id },
          startTime: { lt: endTime },
          endTime:   { gt: startTime },
        },
      });
      if (overlapping) {
        throw {
          status: 409,
          message: `Period overlaps with "${overlapping.name}" (${overlapping.startTime} – ${overlapping.endTime})`,
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
    if (!period) throw { status: 404, message: "Period not found." };

    const linkedTimetables = await prisma.timetable.count({ where: { periodId: id } });
    if (linkedTimetables > 0) {
      throw { status: 400, message: "Cannot delete period — it is linked to timetable entries." };
    }

    await prisma.period.delete({ where: { id } });
    await clearCache(`periods_list_s${schoolId}*`);
    return { id };
  }
}

module.exports = new PeriodService();
