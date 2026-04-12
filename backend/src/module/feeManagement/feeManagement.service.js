const prisma = require("../../config/db.config");
const { getCache, setCache, clearCache } = require("../../utils/redisCache");
const {
  FeeStatus,
  DiscountType,
  Role,
} = require("../../config/constant.config");
const invoiceService = require("../invoice/invoice.service");
const esewa = require("../../lib/esewa");
const {
  Decimal,
  toDecimal,
  money,
  applyDiscounts,
} = require("../../utils/money");

class FeeManagementService {
  _paginate(page, limit) {
    const safePage = Math.max(parseInt(page || 1, 10), 1);
    const safeLimit = Math.min(Math.max(parseInt(limit || 20, 10), 1), 100);
    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }

  async _getGraceDays(schoolId) {
    const setting = await this.getFeeSetting(schoolId);
    return setting?.graceDays ?? 5;
  }

  _deriveStatus(balanceAmount, dueDate, graceDays = 0) {
    if (balanceAmount <= 0) return FeeStatus.PAID;
    if (balanceAmount > 0 && balanceAmount < Number.MAX_SAFE_INTEGER) {
      const effectiveDueDate = new Date(dueDate);
      effectiveDueDate.setDate(effectiveDueDate.getDate() + graceDays);
      if (effectiveDueDate < new Date()) return FeeStatus.OVERDUE;
      return FeeStatus.PENDING;
    }
    return FeeStatus.PENDING;
  }
  _deriveFeeStatus(netAmount, paidAmount, dueDate, graceDays = 0) {
    const net = toDecimal(netAmount);
    const paid = toDecimal(paidAmount);
    const balance = money(net.minus(paid));
    if (balance.lte(0) && paid.lte(0)) return FeeStatus.WAIVED;
    if (balance.lte(0)) return FeeStatus.PAID;
    const effectiveDueDate = new Date(dueDate);
    effectiveDueDate.setDate(effectiveDueDate.getDate() + graceDays);
    const isOverdue = dueDate && effectiveDueDate < new Date();
    if (paid.gt(0) && isOverdue) return FeeStatus.PARTIAL_OVERDUE;
    if (paid.gt(0)) return FeeStatus.PARTIAL;
    if (isOverdue) return FeeStatus.OVERDUE;
    return FeeStatus.PENDING;
  }

  async _writeAuditLog(
    schoolId,
    actor,
    action,
    entityType,
    entityId,
    meta,
    studentId,
  ) {
    try {
      await prisma.feeAuditLog.create({
        data: {
          schoolId,
          action,
          entityType,
          entityId: entityId || null,
          studentId: studentId || null,
          actorId: actor?.id || "system",
          actorName: actor?.name || "System",
          meta: meta || null,
        },
      });
    } catch (err) {
      // Audit log failures must never break main flow
      console.error("[AuditLog] Failed to write audit log:", {
        action,
        entityType,
        entityId,
        err,
      });
    }
  }

  async createFeeCategory(schoolId, data, actor) {
    const category = await prisma.feeCategory.create({
      data: {
        schoolId,
        name: data.name,
        code: data.code || null,
        scope: data.scope || "school",
        description: data.description || null,
      },
    });

    await clearCache(`fees:categories:${schoolId}`);
    this._writeAuditLog(
      schoolId,
      actor,
      "FEE_CATEGORY_CREATED",
      "FeeCategory",
      category.id,
      {
        name: category.name,
        code: category.code,
        scope: category.scope,
      },
    );
    return category;
  }

  async getFeeCategories(schoolId) {
    const cacheKey = `fees:categories:${schoolId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = await prisma.feeCategory.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    });

    await setCache(cacheKey, result, 30);
    return result;
  }
  async getFeeCategoryById(schoolId, id) {
    const result = await prisma.feeCategory.findUnique({
      where: { id, schoolId },
    });
    return result;
  }
  async updateFeeCategory(schoolId, id, data, actor) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code || null;
    if (data.scope !== undefined) updateData.scope = data.scope;
    if (data.description !== undefined)
      updateData.description = data.description || null;

    const category = await prisma.feeCategory.update({
      where: { id, schoolId },
      data: updateData,
    });

    await clearCache(`fees:categories:${schoolId}`);
    this._writeAuditLog(
      schoolId,
      actor,
      "FEE_CATEGORY_UPDATED",
      "FeeCategory",
      id,
      {
        name: category.name,
        code: category.code,
        scope: category.scope,
      },
    );
    return category;
  }

  async deleteFeeCategory(schoolId, id, actor) {
    const existing = await prisma.feeCategory.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw { status: 404, message: "Fee category not found" };

    const structureCount = await prisma.feeStructure.count({
      where: { feeCategoryId: id, schoolId },
    });
    if (structureCount > 0)
      throw {
        status: 409,
        message: "Cannot delete category — fee structures reference it",
      };

    const deleted = await prisma.feeCategory.delete({ where: { id } });
    await clearCache(`fees:categories:${schoolId}`);
    this._writeAuditLog(
      schoolId,
      actor,
      "FEE_CATEGORY_DELETED",
      "FeeCategory",
      id,
      {
        name: existing.name,
        code: existing.code,
      },
    );
    return deleted;
  }

  async createFeeStructure(schoolId, data, actor) {
    const classExists = await prisma.class.findFirst({
      where: { id: data.classId, schoolId },
    });
    if (!classExists) throw { status: 404, message: "Class not found" };

    const academicYearExists = await prisma.academicYear.findFirst({
      where: { id: data.academicYearId, schoolId },
    });
    if (!academicYearExists)
      throw { status: 404, message: "Academic year not found" };

    const categoryExists = await prisma.feeCategory.findFirst({
      where: { id: data.feeCategoryId, schoolId },
    });
    if (!categoryExists)
      throw { status: 404, message: "Fee category not found" };

    const duplicateStructure = await prisma.feeStructure.findFirst({
      where: {
        schoolId,
        classId: data.classId,
        academicYearId: data.academicYearId,
        feeCategoryId: data.feeCategoryId,
      },
    });

    if (duplicateStructure) {
      throw {
        status: 400,
        message: `Fee structure already exists for ${categoryExists.name} in ${classExists.name}`,
      };
    }

    const structure = await prisma.feeStructure.create({
      data: {
        schoolId,
        classId: data.classId,
        academicYearId: data.academicYearId,
        feeCategoryId: data.feeCategoryId,
        amount: data.amount,
        frequency: data.frequency,
        allowPartialPayment: data.allowPartialPayment ?? true,
        isOptional: data.isOptional ?? false,
        isActive: data.isActive ?? true,
      },
      include: {
        feeCategory: true,
        class: true,
        academicYear: true,
      },
    });

    await clearCache(`fees:structures:${schoolId}:*`);
    this._writeAuditLog(
      schoolId,
      actor,
      "FEE_STRUCTURE_CREATED",
      "FeeStructure",
      structure.id,
      {
        categoryName: structure.feeCategory?.name,
        className: structure.class?.name,
        amount: Number(structure.amount),
        frequency: structure.frequency,
      },
    );
    return structure;
  }

  async getFeeStructures(schoolId, filters) {
    const { classId, academicYearId } = filters;

    const cacheKey = `fees:structures:${schoolId}:${classId || "all"}:${academicYearId || "all"}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = await prisma.feeStructure.findMany({
      where: {
        schoolId,
        ...(classId ? { classId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: {
        feeCategory: true,
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: [{ classId: "asc" }, { createdAt: "desc" }],
    });

    await setCache(cacheKey, result, 30);
    return result;
  }
  async getFeeStructureById(schoolId, id) {
    const structure = await prisma.feeStructure.findFirst({
      where: { id, schoolId },
      include: {
        feeCategory: true,
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    if (!structure) throw { status: 404, message: "Fee structure not found" };
    return structure;
  }

  async updateFeeStructure(schoolId, id, data, actor) {
    const existing = await prisma.feeStructure.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw { status: 404, message: "Fee structure not found" };

    if (data.classId) {
      const classExists = await prisma.class.findFirst({
        where: { id: data.classId, schoolId },
      });
      if (!classExists) throw { status: 404, message: "Class not found" };
    }

    if (data.academicYearId) {
      const academicYearExists = await prisma.academicYear.findFirst({
        where: { id: data.academicYearId, schoolId },
      });
      if (!academicYearExists)
        throw { status: 404, message: "Academic year not found" };
    }

    if (data.feeCategoryId) {
      const categoryExists = await prisma.feeCategory.findFirst({
        where: { id: data.feeCategoryId, schoolId },
      });
      if (!categoryExists)
        throw { status: 404, message: "Fee category not found" };
    }

    const duplicateCheck = await prisma.feeStructure.findFirst({
      where: {
        schoolId,
        id: { not: id },
        classId: data.classId || existing.classId,
        academicYearId: data.academicYearId || existing.academicYearId,
        feeCategoryId: data.feeCategoryId || existing.feeCategoryId,
      },
    });

    if (duplicateCheck) {
      throw {
        status: 400,
        message: "A fee structure for this category and class already exists",
      };
    }

    const updated = await prisma.feeStructure.update({
      where: { id },
      data: {
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.academicYearId !== undefined && {
          academicYearId: data.academicYearId,
        }),
        ...(data.feeCategoryId !== undefined && {
          feeCategoryId: data.feeCategoryId,
        }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.allowPartialPayment !== undefined && {
          allowPartialPayment: data.allowPartialPayment,
        }),
        ...(data.isOptional !== undefined && { isOptional: data.isOptional }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        feeCategory: true,
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    await clearCache(`fees:structures:${schoolId}:*`);
    this._writeAuditLog(
      schoolId,
      actor,
      "FEE_STRUCTURE_UPDATED",
      "FeeStructure",
      id,
      {
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        frequency: data.frequency,
        isActive: data.isActive,
      },
    );
    return updated;
  }

  async deleteFeeStructure(schoolId, id, actor) {
    const existing = await prisma.feeStructure.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw { status: 404, message: "Fee structure not found" };

    const assignedCount = await prisma.studentFee.count({
      where: { feeStructureId: id },
    });
    if (assignedCount > 0)
      throw {
        status: 409,
        message: "Cannot delete structure — student fees are assigned to it",
      };

    const deleted = await prisma.feeStructure.delete({ where: { id } });
    await clearCache(`fees:structures:${schoolId}:*`);
    this._writeAuditLog(
      schoolId,
      actor,
      "FEE_STRUCTURE_DELETED",
      "FeeStructure",
      id,
      {
        amount: Number(existing.amount),
      },
    );
    return deleted;
  }

  async upsertFeeSetting(schoolId, data, actor) {
    const setting = await prisma.feeSetting.upsert({
      where: { schoolId },
      create: {
        schoolId,
        graceDays: data.graceDays,
        reminderEnabled: data.reminderEnabled,
        showOverdueFeeTab: data.showOverdueFeeTab ?? true,
        defaultDueDays: data.defaultDueDays ?? 30,
        scholarshipCategories: Array.isArray(data.scholarshipCategories) ? data.scholarshipCategories : [],
        minPaymentAmount: data.minPaymentAmount ?? 0,
      },
      update: {
        graceDays: data.graceDays,
        reminderEnabled: data.reminderEnabled,
        ...(data.showOverdueFeeTab !== undefined && {
          showOverdueFeeTab: data.showOverdueFeeTab,
        }),
        ...(data.defaultDueDays !== undefined && {
          defaultDueDays: data.defaultDueDays,
        }),
        ...(data.scholarshipCategories !== undefined && {
          scholarshipCategories: data.scholarshipCategories,
        }),
        ...(data.minPaymentAmount !== undefined && {
          minPaymentAmount: data.minPaymentAmount,
        }),
      },
    });

    await clearCache(`fees:setting:${schoolId}`);
    this._writeAuditLog(
      schoolId,
      actor,
      "FEE_SETTING_UPDATED",
      "FeeSetting",
      setting.id,
      {
        graceDays: setting.graceDays,
        reminderEnabled: setting.reminderEnabled,
        showOverdueFeeTab: setting.showOverdueFeeTab,
        defaultDueDays: setting.defaultDueDays,
        minPaymentAmount: setting.minPaymentAmount,
      },
    );
    return setting;
  }

  async getFeeSetting(schoolId) {
    const cacheKey = `fees:setting:${schoolId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let setting = await prisma.feeSetting.findUnique({
      where: { schoolId },
    });

    if (!setting) {
      setting = await prisma.feeSetting.create({
        data: { schoolId },
      });
    }

    await setCache(cacheKey, setting, 600);
    return setting;
  }

  async upsertScholarship(schoolId, data, actor) {
    const graceDays = await this._getGraceDays(schoolId);
    const student = await prisma.studentProfile.findFirst({
      where: { id: data.studentId, schoolId },
      include: { user: { select: { name: true } } },
    });
    if (!student) throw { status: 404, message: "Student not found" };

    let category = null;
    if (data.feeCategoryId) {
      category = await prisma.feeCategory.findFirst({
        where: { id: data.feeCategoryId, schoolId },
      });
      if (!category) throw { status: 404, message: "Fee category not found" };

      // Load scholarship-eligible categories from school settings (DB-driven, not hardcoded)
      const feeSetting = await prisma.feeSetting.findUnique({
        where: { schoolId },
      });
      const allowedCategories = feeSetting?.scholarshipCategories ?? [];
      if (allowedCategories.length === 0) {
        throw {
          status: 400,
          message: "No scholarship-eligible categories configured. Please add categories in Fee Settings first.",
        };
      }
      const nameLower = category.name.toLowerCase();
      if (!allowedCategories.some((a) => nameLower.includes(a.toLowerCase()))) {
        throw {
          status: 400,
          message: `Scholarship discount can only be applied to: ${allowedCategories.join(", ")}`,
        };
      }
    }

    if (new Date(data.startDate) > new Date(data.endDate)) {
      throw {
        status: 400,
        message: "startDate cannot be greater than endDate",
      };
    }

    const scholarship = await prisma.$transaction(async (tx) => {
      // ── Duplicate guard: prevent double-discounting for same period/type ──────
      const duplicate = await tx.studentScholarship.findFirst({
        where: {
          schoolId,
          studentId: data.studentId,
          feeCategoryId: data.feeCategoryId || null,
          type: data.type,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });
      if (duplicate) {
        throw {
          status: 409,
          message:
            "An identical scholarship already exists for this student and period",
        };
      }

      const created = await tx.studentScholarship.create({
        data: {
          schoolId,
          studentId: data.studentId,
          feeCategoryId: data.feeCategoryId || null,
          type: data.type,
          value: data.value,
          reason: data.reason || null,
          referredBy: data.referredBy || null,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          isActive: data.isActive ?? true,
        },
      });

      // Retroactively recalculate existing StudentFee records for this student
      const feeWhere = {
        schoolId,
        studentId: data.studentId,
        status: { notIn: [FeeStatus.PAID, FeeStatus.WAIVED] },
      };
      if (data.feeCategoryId) {
        feeWhere.feeStructure = { feeCategoryId: data.feeCategoryId };
      }
      const affectedFees = await tx.studentFee.findMany({
        where: feeWhere,
        include: { feeStructure: { select: { feeCategoryId: true } } },
      });

      // ── Batch-fetch all scholarships once (fixes N+1 per-fee query) ──────────
      const allScholarships = await tx.studentScholarship.findMany({
        where: { schoolId, studentId: data.studentId, isActive: true },
      });

      for (const fee of affectedFees) {
        const fallbackDate = fee.periodStart ?? fee.dueDate;
        const fallbackEnd = fee.periodEnd ?? fee.dueDate;
        // Filter in JS instead of querying per fee
        const scholarships = this._filterScholarships(
          allScholarships,
          fee.feeStructure?.feeCategoryId,
          fallbackDate,
          fallbackEnd,
        );
        const newDiscount = this._calculateDiscount(
          fee.originalAmount,
          scholarships,
        );
        const newNet = money(toDecimal(fee.originalAmount).minus(newDiscount));
        const newBalance = money(newNet.minus(toDecimal(fee.paidAmount)));
        const newStatus = this._deriveFeeStatus(
          newNet,
          fee.paidAmount,
          fee.dueDate,
          graceDays,
        );
        await tx.studentFee.update({
          where: { id: fee.id },
          data: {
            discountAmount: newDiscount,
            netAmount: newNet,
            balanceAmount: newBalance,
            status: newStatus,
          },
        });
      }

      return created;
    });

    this._writeAuditLog(
      schoolId,
      actor,
      "SCHOLARSHIP_CREATED",
      "StudentScholarship",
      scholarship.id,
      {
        studentName: student.user?.name,
        feeCategory: category?.name || "All Applicable",
        type: data.type,
        value: Number(data.value),
        referredBy: data.referredBy || null,
      },
      data.studentId,
    );
    return scholarship;
  }

  /**
   * Filter a pre-fetched scholarship list for a specific fee.
   * Used to avoid N+1 queries in bulk recalculation loops.
   */
  _filterScholarships(allScholarships, feeCategoryId, periodStart, periodEnd) {
    const start = periodStart ? new Date(periodStart) : null;
    const end = periodEnd ? new Date(periodEnd) : null;
    return allScholarships.filter((s) => {
      const catMatch = !s.feeCategoryId || s.feeCategoryId === feeCategoryId;
      if (!catMatch) return false;
      const sStart = new Date(s.startDate);
      const sEnd = new Date(s.endDate);
      const startOk = !end || sStart <= end;
      const endOk = !start || sEnd >= start;
      return startOk && endOk;
    });
  }

  async _getApplicableScholarships(
    tx,
    schoolId,
    studentId,
    feeCategoryId,
    periodStart,
    periodEnd,
  ) {
    return tx.studentScholarship.findMany({
      where: {
        schoolId,
        studentId,
        isActive: true,
        OR: [{ feeCategoryId: null }, { feeCategoryId }],
        startDate: { lte: periodEnd || periodStart },
        endDate: { gte: periodStart || periodEnd },
      },
    });
  }

  async getActiveScholarships(schoolId, studentId) {
    return prisma.studentScholarship.findMany({
      where: { schoolId, studentId },
      include: { feeCategory: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteScholarship(schoolId, id, actor) {
    const graceDays = await this._getGraceDays(schoolId);
    return prisma.$transaction(async (tx) => {
      // ── findFirst inside the transaction prevents TOCTOU stale-read race ───────
      const scholarship = await tx.studentScholarship.findFirst({
        where: { id, schoolId },
      });
      if (!scholarship) throw { status: 404, message: "Scholarship not found" };

      // Retroactively recalculate existing StudentFee records for this student
      const feeWhere = {
        schoolId,
        studentId: scholarship.studentId,
        status: { notIn: [FeeStatus.PAID, FeeStatus.WAIVED] },
      };
      if (scholarship.feeCategoryId) {
        feeWhere.feeStructure = { feeCategoryId: scholarship.feeCategoryId };
      }

      const affectedFees = await tx.studentFee.findMany({
        where: feeWhere,
        include: { feeStructure: { select: { feeCategoryId: true } } },
      });

      // Delete the scholarship first before recalculating
      await tx.studentScholarship.delete({ where: { id } });

      // ── Batch-fetch remaining active scholarships once (fixes N+1) ───────────
      const remainingScholarships = await tx.studentScholarship.findMany({
        where: { schoolId, studentId: scholarship.studentId, isActive: true },
      });

      for (const fee of affectedFees) {
        const fallbackDate = fee.periodStart ?? fee.dueDate;
        const fallbackEnd = fee.periodEnd ?? fee.dueDate;

        // Filter in JS — no extra DB query per fee
        const activeScholarships = this._filterScholarships(
          remainingScholarships,
          fee.feeStructure?.feeCategoryId,
          fallbackDate,
          fallbackEnd,
        );

        const newDiscount = this._calculateDiscount(
          fee.originalAmount,
          activeScholarships,
        );
        const newNet = money(toDecimal(fee.originalAmount).minus(newDiscount));
        const newBalance = money(newNet.minus(toDecimal(fee.paidAmount)));
        const newStatus = this._deriveFeeStatus(
          newNet,
          fee.paidAmount,
          fee.dueDate,
          graceDays,
        );

        await tx.studentFee.update({
          where: { id: fee.id },
          data: {
            discountAmount: newDiscount,
            netAmount: newNet,
            balanceAmount: newBalance,
            status: newStatus,
          },
        });
      }

      return scholarship;
    });
  }

  _calculateDiscount(originalAmount, scholarships) {
    return applyDiscounts(originalAmount, scholarships);
  }

  async assignStudentFee(schoolId, data, actor) {
    const graceDays = await this._getGraceDays(schoolId);
    const {
      studentId,
      feeStructureId,
      dueDate,
      amount,
      periodLabel,
      periodStart,
      periodEnd,
    } = data;

    return prisma.$transaction(async (tx) => {
      const student = await tx.studentProfile.findFirst({
        where: { id: studentId, schoolId },
      });
      if (!student)
        throw { status: 404, message: "Student not found in this school" };

      const feeStructure = await tx.feeStructure.findFirst({
        where: { id: feeStructureId, schoolId, isActive: true },
        include: {
          feeCategory: true,
          class: { select: { id: true, name: true } },
        },
      });
      if (!feeStructure)
        throw { status: 404, message: "Fee structure not found" };

      // Always verify the student belongs to the fee structure's class.
      // Two paths are supported:
      //   1. Formal StudentEnrollment record (classId match) — preferred
      //   2. Legacy: StudentProfile.class plain-string matches the class name
      //      (students added without a formal enrollment record)
      {
        const enrollment = await tx.studentEnrollment.findFirst({
          where: { studentId, classId: feeStructure.classId },
        });

        const classNameMatch =
          feeStructure.class?.name &&
          student.class &&
          student.class.trim().toLowerCase() ===
            feeStructure.class.name.trim().toLowerCase();

        if (!enrollment && !classNameMatch) {
          throw {
            status: 400,
            message:
              "Student is not enrolled in the class linked to this fee structure",
          };
        }
      }

      const duplicateWhere = periodLabel
        ? {
            studentId,
            feeStructure: { feeCategoryId: feeStructure.feeCategoryId },
            periodLabel,
          }
        : {
            studentId,
            feeStructure: { feeCategoryId: feeStructure.feeCategoryId },
            dueDate: new Date(dueDate),
          };

      const alreadyExists = await tx.studentFee.findFirst({
        where: duplicateWhere,
      });

      if (alreadyExists) {
        const hint = periodLabel
          ? `Fee for this student and period "${periodLabel}" already exists`
          : "Fee for this student and due date already exists";
        throw { status: 400, message: hint };
      }

      const originalAmount = money(amount ?? feeStructure.amount);
      const safePeriodStart = periodStart
        ? new Date(periodStart)
        : new Date(dueDate);
      const safePeriodEnd = periodEnd ? new Date(periodEnd) : new Date(dueDate);

      const scholarships = await this._getApplicableScholarships(
        tx,
        schoolId,
        studentId,
        feeStructure.feeCategoryId,
        safePeriodStart,
        safePeriodEnd,
      );

      const discountAmount = this._calculateDiscount(
        originalAmount,
        scholarships,
      );
      const netAmount = money(toDecimal(originalAmount).minus(discountAmount));
      const paidAmount = 0;
      const balanceAmount = netAmount;
      const status = this._deriveFeeStatus(netAmount, paidAmount, dueDate, graceDays);

      const studentFee = await tx.studentFee.create({
        data: {
          schoolId,
          academicYearId: feeStructure.academicYearId,
          studentId,
          feeStructureId,
          periodLabel: periodLabel || null,
          periodStart: periodStart ? new Date(periodStart) : null,
          periodEnd: periodEnd ? new Date(periodEnd) : null,
          originalAmount,
          discountAmount,
          netAmount,
          paidAmount,
          balanceAmount,
          dueDate: new Date(dueDate),
          status,
        },
        include: {
          feeStructure: {
            include: {
              feeCategory: true,
            },
          },
        },
      });

      this._writeAuditLog(
        schoolId,
        actor,
        "FEE_ASSIGNED",
        "StudentFee",
        studentFee.id,
        {
          feeCategoryName: feeStructure.feeCategory?.name,
          dueDate: dueDate,
          originalAmount: Number(studentFee.originalAmount),
          discountAmount: Number(studentFee.discountAmount), // scholarship deduction
          netAmount: Number(studentFee.netAmount),
        },
        studentId,
      );
      return studentFee;
    });
  }

  async bulkAssignStudentFees(schoolId, data, actor) {
    const graceDays = await this._getGraceDays(schoolId);
    const { classId, feeStructureIds, dueDate, periodLabel } = data;

    return prisma.$transaction(async (tx) => {
      // 1. Fetch valid structures
      const structures = await tx.feeStructure.findMany({
        where: { id: { in: feeStructureIds }, schoolId, isActive: true },
        include: { feeCategory: true },
      });
      if (!structures.length)
        throw { status: 404, message: "No valid fee structures found" };

      // Validate all structures belong to the target class
      const mismatchedStructures = structures.filter((s) => s.classId !== classId);
      if (mismatchedStructures.length > 0) {
        throw {
          status: 400,
          message: "Some fee structures do not belong to the selected class",
        };
      }

      // 2. Fetch all students in this class
      // Include formal enrollments and those matched just by class string
      const classEntity = await tx.class.findFirst({
        where: { id: classId, schoolId },
      });
      if (!classEntity) throw { status: 404, message: "Class not found" };

      const enrollments = await tx.studentEnrollment.findMany({
        where: { classId },
      });
      const enrolledStudentIds = enrollments.map((e) => e.studentId);

      // Find students whose profile simply has the class name matching
      const profileStringMatches = await tx.studentProfile.findMany({
        where: {
          schoolId,
          class: classEntity.name,
          id: { notIn: enrolledStudentIds }, // avoid duplicates
        },
      });

      const allStudentIds = [
        ...enrolledStudentIds,
        ...profileStringMatches.map((p) => p.id),
      ];
      if (!allStudentIds.length)
        return { assigned: 0, skipped: 0, failed: 0, total: 0 };

      // 3. For each structure and each student, determine if we need to assign
      let assignedCount = 0;
      let skippedCount = 0;
      const newFees = [];
      const auditDetails = [];

      for (const structure of structures) {
        // Find existing fees for this structure's category to skip duplicates
        const duplicateWhere = periodLabel
          ? {
              studentId: { in: allStudentIds },
              feeStructure: { feeCategoryId: structure.feeCategoryId },
              periodLabel,
            }
          : {
              studentId: { in: allStudentIds },
              feeStructure: { feeCategoryId: structure.feeCategoryId },
              dueDate: new Date(dueDate),
            };

        const existingFees = await tx.studentFee.findMany({
          where: duplicateWhere,
          select: { studentId: true },
        });
        const existingStudentIds = new Set(
          existingFees.map((f) => f.studentId),
        );

        const originalAmount = money(structure.amount);
        // ── Batch-fetch scholarships for all students in one query (fixes N+1) ──
        const allStudentScholarships = await tx.studentScholarship.findMany({
          where: { schoolId, studentId: { in: allStudentIds }, isActive: true },
        });

        for (const studentId of allStudentIds) {
          if (existingStudentIds.has(studentId)) {
            skippedCount++;
            continue;
          }

          // Filter in JS — no extra DB query per student
          const dueDateObj = new Date(dueDate);
          const studentScholarships = allStudentScholarships.filter(
            (s) => s.studentId === studentId,
          );
          const scholarships = this._filterScholarships(
            studentScholarships,
            structure.feeCategoryId,
            dueDateObj,
            dueDateObj,
          );

          const discountAmount = this._calculateDiscount(
            originalAmount,
            scholarships,
          );
          const netAmount = money(
            toDecimal(originalAmount).minus(discountAmount),
          );
          const status = this._deriveFeeStatus(netAmount, 0, dueDate, graceDays);

          newFees.push({
            schoolId,
            academicYearId: structure.academicYearId,
            studentId,
            feeStructureId: structure.id,
            periodLabel: periodLabel || null,
            originalAmount,
            discountAmount,
            netAmount,
            paidAmount: 0,
            balanceAmount: netAmount,
            dueDate: new Date(dueDate),
            status: status,
          });
          assignedCount++;
        }

        auditDetails.push(structure.feeCategory?.name || structure.id);
      }

      // 4. Create all new assignments
      if (newFees.length > 0) {
        await tx.studentFee.createMany({ data: newFees });
      }

      this._writeAuditLog(
        schoolId,
        actor,
        "BULK_FEE_ASSIGNED",
        "Class",
        classId,
        {
          structures: auditDetails.join(", "),
          dueDate,
          periodLabel: periodLabel || "N/A",
          assigned: assignedCount,
          skipped: skippedCount,
        },
      );

      return {
        assigned: assignedCount,
        skipped: skippedCount,
        failed: 0,
        total: allStudentIds.length * structures.length,
      };
    });
  }

  async deleteStudentFee(schoolId, studentFeeId, actor) {
    return prisma.$transaction(async (tx) => {
      const studentFee = await tx.studentFee.findFirst({
        where: { id: studentFeeId, schoolId },
        include: {
          feeStructure: { include: { feeCategory: true } },
        },
      });
      if (!studentFee)
        throw { status: 404, message: "Student fee not found" };

      if (toDecimal(studentFee.paidAmount).gt(0)) {
        throw {
          status: 409,
          message:
            "Cannot delete a fee that has payments recorded. Remove the payments first.",
        };
      }

      // Delete associated reminders (no cascade configured)
      await tx.feeReminder.deleteMany({
        where: { studentFeeId },
      });

      // Delete payment allocations with zero amount (safety net)
      await tx.feePaymentAllocation.deleteMany({
        where: { studentFeeId },
      });

      await tx.studentFee.delete({ where: { id: studentFeeId } });

      this._writeAuditLog(
        schoolId,
        actor,
        "FEE_DELETED",
        "StudentFee",
        studentFeeId,
        {
          feeCategoryName: studentFee.feeStructure?.feeCategory?.name,
          originalAmount: Number(studentFee.originalAmount),
          netAmount: Number(studentFee.netAmount),
          dueDate: studentFee.dueDate,
        },
        studentFee.studentId,
      );

      return studentFee;
    });
  }

  async updateStudentFee(schoolId, studentFeeId, data, actor) {
    const graceDays = await this._getGraceDays(schoolId);
    return prisma.$transaction(async (tx) => {
      const existing = await tx.studentFee.findFirst({
        where: { id: studentFeeId, schoolId },
        include: {
          feeStructure: { include: { feeCategory: true } },
        },
      });
      if (!existing)
        throw { status: 404, message: "Student fee not found" };

      const updates = {};
      const oldValues = {};

      // Handle amount change — recalculate with scholarships
      if (data.amount !== undefined) {
        const newOriginal = money(data.amount);
        const safePeriodStart =
          data.periodStart ? new Date(data.periodStart) : existing.periodStart ?? existing.dueDate;
        const safePeriodEnd =
          data.periodEnd ? new Date(data.periodEnd) : existing.periodEnd ?? existing.dueDate;

        const scholarships = await this._getApplicableScholarships(
          tx,
          schoolId,
          existing.studentId,
          existing.feeStructure.feeCategoryId,
          safePeriodStart,
          safePeriodEnd,
        );

        const discountAmount = this._calculateDiscount(newOriginal, scholarships);
        const netAmount = money(toDecimal(newOriginal).minus(discountAmount));
        const balanceAmount = money(netAmount.minus(toDecimal(existing.paidAmount)));

        oldValues.originalAmount = Number(existing.originalAmount);
        updates.originalAmount = newOriginal;
        updates.discountAmount = discountAmount;
        updates.netAmount = netAmount;
        updates.balanceAmount = balanceAmount;
      }

      // Handle due date change
      if (data.dueDate !== undefined) {
        oldValues.dueDate = existing.dueDate;
        updates.dueDate = new Date(data.dueDate);
      }

      // Handle period fields
      if (data.periodLabel !== undefined) {
        oldValues.periodLabel = existing.periodLabel;
        updates.periodLabel = data.periodLabel || null;
      }
      if (data.periodStart !== undefined) {
        updates.periodStart = data.periodStart ? new Date(data.periodStart) : null;
      }
      if (data.periodEnd !== undefined) {
        updates.periodEnd = data.periodEnd ? new Date(data.periodEnd) : null;
      }

      if (Object.keys(updates).length === 0) {
        throw { status: 400, message: "No fields to update" };
      }

      // Check for duplicate conflicts if dueDate or periodLabel changed
      const newDueDate = updates.dueDate ?? existing.dueDate;
      const newPeriodLabel = updates.periodLabel !== undefined ? updates.periodLabel : existing.periodLabel;
      const feeCategoryId = existing.feeStructure.feeCategoryId;

      const duplicateWhere = newPeriodLabel
        ? {
            studentId: existing.studentId,
            feeStructure: { feeCategoryId },
            periodLabel: newPeriodLabel,
            id: { not: studentFeeId },
          }
        : {
            studentId: existing.studentId,
            feeStructure: { feeCategoryId },
            dueDate: new Date(newDueDate),
            id: { not: studentFeeId },
          };

      const conflict = await tx.studentFee.findFirst({ where: duplicateWhere });
      if (conflict) {
        throw {
          status: 400,
          message: "Another fee for this student and period/date already exists",
        };
      }

      // Re-derive status with updated values
      const finalNet = updates.netAmount ?? existing.netAmount;
      const finalPaid = existing.paidAmount;
      updates.status = this._deriveFeeStatus(finalNet, finalPaid, newDueDate, graceDays);

      const updated = await tx.studentFee.update({
        where: { id: studentFeeId },
        data: updates,
        include: {
          feeStructure: { include: { feeCategory: true } },
        },
      });

      this._writeAuditLog(
        schoolId,
        actor,
        "FEE_UPDATED",
        "StudentFee",
        studentFeeId,
        {
          feeCategoryName: existing.feeStructure?.feeCategory?.name,
          oldValues,
          newValues: Object.fromEntries(
            Object.keys(oldValues).map((k) => [k, updates[k] !== undefined ? updates[k] : existing[k]])
          ),
        },
        existing.studentId,
      );

      return updated;
    });
  }

  async _assertStudentAccess(schoolId, requestedStudentId, authUser) {
    if (
      authUser.role === Role.STUDENT &&
      authUser.studentProfileId !== requestedStudentId
    ) {
      throw { status: 403, message: "You can only view your own fees" };
    }

    if (authUser.role === Role.PARENT) {
      const relation = await prisma.parentProfile.findFirst({
        where: {
          id: authUser.parentProfileId,
          schoolId,
          students: {
            some: { id: requestedStudentId },
          },
        },
      });

      if (!relation) {
        throw {
          status: 403,
          message: "You are not allowed to view this student's fees",
        };
      }
    }
  }

  async getStudentFees(schoolId, studentId, query, authUser) {
    await this._assertStudentAccess(schoolId, studentId, authUser);

    const { page, limit, skip } = this._paginate(query.page, query.limit);
    const where = {
      schoolId,
      studentId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total, summary] = await prisma.$transaction([
      prisma.studentFee.findMany({
        where,
        include: {
          feeStructure: {
            include: {
              feeCategory: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        skip,
        take: limit,
      }),
      prisma.studentFee.count({ where }),
      prisma.studentFee.aggregate({
        where: { schoolId, studentId },
        _sum: {
          originalAmount: true,
          discountAmount: true,
          netAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
      }),
    ]);

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalOriginalAmount: money(summary._sum.originalAmount),
        totalDiscountAmount: money(summary._sum.discountAmount),
        totalNetAmount: money(summary._sum.netAmount),
        totalPaidAmount: money(summary._sum.paidAmount),
        totalBalanceAmount: money(summary._sum.balanceAmount),
      },
      items,
    };
  }

  async getParentFees(schoolId, parentId, authUser) {
    if (
      authUser.role === Role.PARENT &&
      authUser.parentProfileId !== parentId
    ) {
      throw {
        status: 403,
        message: "You can only view your own children's fees",
      };
    }

    const parent = await prisma.parentProfile.findFirst({
      where: { id: parentId, schoolId },
      include: {
        students: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!parent) throw { status: 404, message: "Parent not found" };

    const studentIds = parent.students.map((s) => s.id);
    if (!studentIds.length) {
      return {
        summary: {
          totalOriginalAmount: 0,
          totalDiscountAmount: 0,
          totalNetAmount: 0,
          totalPaidAmount: 0,
          totalBalanceAmount: 0,
        },
        students: [],
      };
    }

    const fees = await prisma.studentFee.findMany({
      where: {
        schoolId,
        studentId: { in: studentIds },
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        feeStructure: {
          include: {
            feeCategory: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }],
    });

    const summary = fees.reduce(
      (acc, fee) => {
        acc.totalOriginalAmount = acc.totalOriginalAmount.add(
          toDecimal(fee.originalAmount || 0),
        );
        acc.totalDiscountAmount = acc.totalDiscountAmount.add(
          toDecimal(fee.discountAmount || 0),
        );
        acc.totalNetAmount = acc.totalNetAmount.add(
          toDecimal(fee.netAmount || 0),
        );
        acc.totalPaidAmount = acc.totalPaidAmount.add(
          toDecimal(fee.paidAmount || 0),
        );
        acc.totalBalanceAmount = acc.totalBalanceAmount.add(
          toDecimal(fee.balanceAmount || 0),
        );
        return acc;
      },
      {
        totalOriginalAmount: toDecimal(0),
        totalDiscountAmount: toDecimal(0),
        totalNetAmount: toDecimal(0),
        totalPaidAmount: toDecimal(0),
        totalBalanceAmount: toDecimal(0),
      },
    );

    return {
      summary: {
        totalOriginalAmount: money(summary.totalOriginalAmount),
        totalDiscountAmount: money(summary.totalDiscountAmount),
        totalNetAmount: money(summary.totalNetAmount),
        totalPaidAmount: money(summary.totalPaidAmount),
        totalBalanceAmount: money(summary.totalBalanceAmount),
      },
      students: parent.students.map((student) => ({
        studentId: student.id,
        studentName: student.user?.name || null,
        fees: fees.filter((f) => f.studentId === student.id),
      })),
    };
  }

  async recordPayment(schoolId, data, actor, idempotencyKey) {
    const feeSetting = await this.getFeeSetting(schoolId);
    const graceDays = feeSetting?.graceDays ?? 5;
    const minPaymentAmount = toDecimal(feeSetting?.minPaymentAmount ?? 0);
    const {
      studentId,
      totalAmount,
      paymentMethod,
      paymentReference,
      transactionId,
      receivedBy,
      note,
      allocations,
    } = data;

    // ── Idempotency guard: safe replay on network retries ────────────────────
    if (idempotencyKey) {
      const existing = await prisma.feePayment.findUnique({
        where: { idempotencyKey },
      });
      if (existing) return { payment: existing, allocations: [] };
    }

    // For eSewa payments: verify the transaction against eSewa's status API before
    // writing anything to the DB. If no eSewa gateway is configured, skip and allow
    // manual override (accountant takes responsibility).
    if (paymentMethod === "esewa" && transactionId) {
      const esewaGateway = await prisma.schoolPaymentGateway.findFirst({
        where: { schoolId, paymentMethod: "esewa", status: "active" },
      });
      if (esewaGateway?.config) {
        const esewaStatus = await esewa.checkTransactionStatus(
          esewaGateway.config,
          {
            totalAmount: String(totalAmount),
            transactionUuid: transactionId,
          },
        );
        if (esewaStatus.status !== "COMPLETE") {
          throw {
            status: 400,
            message: `eSewa transaction not verified (status: ${esewaStatus.status ?? "unknown"}). Please check the transaction reference.`,
          };
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.studentProfile.findFirst({
        where: { id: studentId, schoolId },
      });
      if (!student) throw { status: 404, message: "Student not found" };

      let targetAllocations = allocations;

      if (!targetAllocations || !targetAllocations.length) {
        // Row-level lock prevents concurrent double-allocation
        const unpaidFees = await tx.$queryRaw`
          SELECT sf.*, fs."allowPartialPayment"
          FROM "StudentFee" sf
          JOIN "FeeStructure" fs ON fs.id = sf."feeStructureId"
          WHERE sf."studentId" = ${studentId}
            AND sf."schoolId" = ${schoolId}
            AND sf."balanceAmount" > 0
          ORDER BY sf."dueDate" ASC, sf."createdAt" ASC
          FOR UPDATE OF sf
        `;

        if (!unpaidFees.length) {
          throw {
            status: 400,
            message: "No unpaid fees found for this student",
          };
        }

        let remaining = toDecimal(totalAmount);
        targetAllocations = [];

        for (const fee of unpaidFees) {
          if (remaining.lte(0)) break;
          const feeBalance = toDecimal(fee.balanceAmount);

          if (!fee.allowPartialPayment) {
            // Must pay full balance or skip
            if (remaining.gte(feeBalance)) {
              targetAllocations.push({
                studentFeeId: fee.id,
                amount: money(feeBalance),
              });
              remaining = remaining.minus(feeBalance);
            }
            continue;
          }

          // Partial allowed
          let allocAmount = Decimal.min(remaining, feeBalance);

          // Enforce minimum (unless paying full remaining balance)
          if (
            minPaymentAmount.gt(0) &&
            allocAmount.lt(minPaymentAmount) &&
            allocAmount.lt(feeBalance)
          ) {
            continue;
          }

          if (allocAmount.gt(0)) {
            targetAllocations.push({
              studentFeeId: fee.id,
              amount: money(allocAmount),
            });
            remaining = remaining.minus(allocAmount);
          }
        }

        if (remaining.gt(0)) {
          throw {
            status: 400,
            message:
              "Payment amount exceeds all generated dues. Generate future dues first for advance allocation.",
          };
        }
      }

      const allocationTotal = targetAllocations.reduce(
        (sum, item) => sum.add(toDecimal(item.amount)),
        toDecimal(0),
      );

      if (!money(allocationTotal).eq(money(totalAmount))) {
        throw {
          status: 400,
          message: "Allocation total must equal totalAmount",
        };
      }

      const feeIds = [...new Set(targetAllocations.map((a) => a.studentFeeId))];
      // Row-level lock prevents concurrent double-allocation
      const fees = await tx.$queryRaw`
        SELECT sf.*, fs."allowPartialPayment"
        FROM "StudentFee" sf
        JOIN "FeeStructure" fs ON fs.id = sf."feeStructureId"
        WHERE sf."schoolId" = ${schoolId}
          AND sf."studentId" = ${studentId}
          AND sf.id = ANY(${feeIds}::text[])
        FOR UPDATE OF sf
      `;

      if (fees.length !== feeIds.length) {
        throw { status: 404, message: "One or more fee records are invalid" };
      }

      const feeMap = new Map(fees.map((f) => [f.id, f]));

      for (const allocation of targetAllocations) {
        const fee = feeMap.get(allocation.studentFeeId);
        if (!fee)
          throw { status: 404, message: "Invalid fee allocation target" };

        if (Number(allocation.amount) > Number(fee.balanceAmount)) {
          throw {
            status: 400,
            message: `Allocation exceeds balance for fee ${fee.id}`,
          };
        }

        // Enforce allowPartialPayment
        const allocDec = toDecimal(allocation.amount);
        const balanceDec = toDecimal(fee.balanceAmount);
        if (!fee.allowPartialPayment && allocDec.lt(balanceDec)) {
          throw {
            status: 400,
            message: `This fee does not allow partial payment. You must pay the full balance of ${money(balanceDec)}.`,
          };
        }

        // Enforce minimum payment amount
        if (
          minPaymentAmount.gt(0) &&
          allocDec.lt(minPaymentAmount) &&
          allocDec.lt(balanceDec)
        ) {
          throw {
            status: 400,
            message: `Each payment must be at least ${money(minPaymentAmount)} (unless paying the full remaining balance).`,
          };
        }
      }

      const payment = await tx.feePayment.create({
        data: {
          schoolId,
          studentId,
          totalAmount,
          paymentDate: new Date(),
          paymentMethod,
          paymentReference,
          transactionId: transactionId || null,
          receivedBy: receivedBy || null,
          note: note || null,
          idempotencyKey: idempotencyKey || null,
        },
      });

      const createdAllocations = [];

      for (const allocation of targetAllocations) {
        const fee = feeMap.get(allocation.studentFeeId);
        const updatedPaidAmount = money(
          toDecimal(fee.paidAmount).add(toDecimal(allocation.amount)),
        );
        const updatedBalanceAmount = money(
          toDecimal(fee.netAmount).minus(updatedPaidAmount),
        );
        const updatedStatus = this._deriveFeeStatus(
          fee.netAmount,
          updatedPaidAmount,
          fee.dueDate,
          graceDays,
        );

        await tx.feePaymentAllocation.create({
          data: {
            schoolId,
            paymentId: payment.id,
            studentFeeId: allocation.studentFeeId,
            amount: allocation.amount,
          },
        });

        await tx.studentFee.update({
          where: { id: fee.id },
          data: {
            paidAmount: updatedPaidAmount,
            balanceAmount: updatedBalanceAmount,
            status: updatedStatus,
          },
        });

        createdAllocations.push({
          studentFeeId: fee.id,
          amount: allocation.amount,
          updatedPaidAmount,
          updatedBalanceAmount,
          updatedStatus,
        });
      }

      this._writeAuditLog(
        schoolId,
        actor,
        "PAYMENT_RECORDED",
        "FeePayment",
        payment.id,
        {
          studentName: student.user?.name,
          amount: Number(totalAmount),
          paymentMethod,
        },
        studentId,
      );

      return {
        payment,
        allocations: createdAllocations,
      };
    });

    // Auto-generate a payment receipt invoice AFTER the transaction commits so
    // a failure here never rolls back the recorded payment.
    const paidFeeIds = result.allocations.map((a) => a.studentFeeId);
    try {
      await invoiceService.generateForStudent(
        schoolId,
        studentId,
        "PAYMENT_RECEIPT",
        paidFeeIds,
      );
    } catch (err) {
      console.error(
        "[recordPayment] Invoice generation failed:",
        err?.message ?? err,
      );
    }

    return result;
  }

  async scheduleReminder(schoolId, data, actor) {
    const { studentFeeId, reminderDate, reminderType } = data;

    return prisma.$transaction(async (tx) => {
      const studentFee = await tx.studentFee.findFirst({
        where: { id: studentFeeId, schoolId },
        include: {
          student: {
            include: {
              parents: true,
            },
          },
        },
      });

      if (!studentFee) {
        throw { status: 404, message: "Student fee not found" };
      }

      if (
        studentFee.status === FeeStatus.PAID ||
        studentFee.status === FeeStatus.WAIVED
      ) {
        throw {
          status: 400,
          message: "Reminder cannot be scheduled for a paid or waived fee",
        };
      }

      // Prevent duplicate pending reminders of the same type
      const existingPending = await tx.feeReminder.findFirst({
        where: { studentFeeId, reminderType, sentAt: null },
      });
      if (existingPending) {
        throw {
          status: 409,
          message:
            "A pending reminder of this type already exists for this fee",
        };
      }

      const parents = studentFee.student?.parents || [];
      if (!parents.length) {
        throw { status: 400, message: "No parent linked to this student" };
      }

      const reminders = [];

      for (const parent of parents) {
        const reminder = await tx.feeReminder.create({
          data: {
            schoolId,
            parentId: parent.id,
            studentFeeId,
            reminderType,
            reminderDate: new Date(reminderDate),
          },
        });
        reminders.push(reminder);
      }

      await tx.studentFee.update({
        where: { id: studentFeeId },
        data: {
          reminderDate: new Date(reminderDate),
          reminderCount: { increment: 1 },
        },
      });

      this._writeAuditLog(
        schoolId,
        actor,
        "REMINDER_SCHEDULED",
        "FeeReminder",
        reminders[0]?.id,
        {
          reminderType,
          reminderDate,
        },
      );
      return reminders;
    });
  }

  async getPendingReminders(schoolId, query) {
    const { page, limit, skip } = this._paginate(query.page, query.limit);

    const where = {
      schoolId,
      sentAt: null,
      reminderDate: { lte: new Date() },
    };

    const [items, total] = await prisma.$transaction([
      prisma.feeReminder.findMany({
        where,
        include: {
          parent: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
            },
          },
          studentFee: {
            include: {
              student: {
                include: {
                  user: { select: { name: true } },
                },
              },
              feeStructure: {
                include: {
                  feeCategory: true,
                },
              },
            },
          },
        },
        orderBy: { reminderDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.feeReminder.count({ where }),
    ]);

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      items,
    };
  }

  async getSchoolFeeRecords(schoolId, authUser, query) {
    const { page, limit, skip } = this._paginate(query.page, query.limit);
    const { status } = query;

    const where = { schoolId };
    if (status) where.status = status;

    // STUDENT: only their own fees
    if (authUser.role === Role.STUDENT) {
      const studentProfile = await prisma.studentProfile.findFirst({
        where: { userId: authUser.id, schoolId },
      });
      if (!studentProfile)
        throw { status: 403, message: "Student profile not found" };
      where.studentId = studentProfile.id;
    }

    // PARENT: only their children's fees
    if (authUser.role === Role.PARENT) {
      const parentProfile = await prisma.parentProfile.findFirst({
        where: { userId: authUser.id, schoolId },
        include: { students: { select: { id: true } } },
      });
      if (!parentProfile)
        throw { status: 403, message: "Parent profile not found" };
      where.studentId = { in: parentProfile.students.map((s) => s.id) };
    }

    const [items, total] = await prisma.$transaction([
      prisma.studentFee.findMany({
        where,
        include: {
          student: {
            include: { user: { select: { name: true, email: true } } },
          },
          feeStructure: { include: { class: { select: { name: true } } } },
        },
        orderBy: { dueDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.studentFee.count({ where }),
    ]);

    const setting = await prisma.feeSetting.findUnique({ where: { schoolId } });
    const graceDays = setting?.graceDays ?? 5;

    return {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      graceDays,
      items: items.map((item) => ({
        id: item.id,
        studentName: item.student?.user?.name ?? null,
        studentEmail: item.student?.user?.email ?? null,
        class: item.feeStructure?.class?.name ?? null,
        discountAmount: money(item.discountAmount),
        netAmount: money(item.netAmount),
        paidAmount: money(item.paidAmount),
        status: item.status,
        dueDate: item.dueDate,
      })),
    };
  }

  async getSchoolPayments(schoolId, authUser, query) {
    const { page, limit, skip } = this._paginate(query.page, query.limit);
    const where = { schoolId };

    // STUDENT: only their own payments
    if (authUser.role === Role.STUDENT) {
      const studentProfile = await prisma.studentProfile.findFirst({
        where: { userId: authUser.id, schoolId },
      });
      if (!studentProfile)
        throw { status: 403, message: "Student profile not found" };
      where.studentId = studentProfile.id;
    }

    // PARENT: only their children's payments
    if (authUser.role === Role.PARENT) {
      const parentProfile = await prisma.parentProfile.findFirst({
        where: { userId: authUser.id, schoolId },
        include: { students: { select: { id: true } } },
      });
      if (!parentProfile)
        throw { status: 403, message: "Parent profile not found" };
      where.studentId = { in: parentProfile.students.map((s) => s.id) };
    }

    const [items, total] = await prisma.$transaction([
      prisma.feePayment.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              enrollments: { include: { class: { select: { name: true } } } },
            },
          },
          allocations: {
            include: {
              studentFee: {
                include: {
                  feeStructure: {
                    include: {
                      feeCategory: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { paymentDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.feePayment.count({ where }),
    ]);

    // Fallback: if Prisma's relation include returned null for any student,
    // fetch those profiles directly to guarantee data is always present.
    const missingIds = [
      ...new Set(
        items.filter((i) => !i.student && i.studentId).map((i) => i.studentId),
      ),
    ];
    const fallback = {};
    if (missingIds.length > 0) {
      const profiles = await prisma.studentProfile.findMany({
        where: { id: { in: missingIds } },
        include: {
          user: { select: { name: true, email: true } },
          enrollments: { include: { class: { select: { name: true } } } },
        },
      });
      for (const p of profiles) fallback[p.id] = p;
    }

    return {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      items: items.map((item) => {
        const stu = item.student || fallback[item.studentId] || null;
        return {
          id: item.id,
          schoolId: item.schoolId,
          studentId: item.studentId,
          totalAmount: money(item.totalAmount),
          paymentDate: item.paymentDate,
          createdAt: item.createdAt,
          paymentMethod: item.paymentMethod,
          paymentReference: item.paymentReference,
          transactionId: item.transactionId,
          receivedBy: item.receivedBy ?? null,
          note: item.note ?? null,
          status: item.status,
          student: stu
            ? {
                admissionNumber: stu.admissionNumber ?? null,
                class: stu.class ?? null,
                user: {
                  name: stu.user?.name ?? null,
                  email: stu.user?.email ?? null,
                },
                enrollments: (stu.enrollments ?? []).map((e) => ({
                  class: e.class ? { name: e.class.name } : null,
                })),
              }
            : null,
          allocations: (item.allocations ?? []).map((a) => ({
            amount: Number(a.amount),
            studentFee: a.studentFee
              ? {
                  feeStructure: a.studentFee.feeStructure
                    ? {
                        feeCategory: a.studentFee.feeStructure.feeCategory
                          ? { name: a.studentFee.feeStructure.feeCategory.name }
                          : null,
                      }
                    : null,
                }
              : null,
          })),
        };
      }),
    };
  }

  async extendStudentFeeDueDate(schoolId, feeId, days) {
    const graceDays = await this._getGraceDays(schoolId);
    const fee = await prisma.studentFee.findFirst({
      where: { id: feeId, schoolId },
    });
    if (!fee) throw { status: 404, message: "Fee record not found" };

    const daysToAdd = Math.max(1, Math.min(90, parseInt(days, 10)));
    const newDueDate = new Date(fee.dueDate);
    newDueDate.setDate(newDueDate.getDate() + daysToAdd);

    const newStatus = this._deriveFeeStatus(
      Number(fee.netAmount),
      Number(fee.paidAmount),
      newDueDate,
      graceDays,
    );

    return prisma.studentFee.update({
      where: { id: feeId },
      data: { dueDate: newDueDate, status: newStatus },
    });
  }

  async getFeeAuditLogs(schoolId, page, limit, studentId) {
    const {
      page: safePage,
      limit: safeLimit,
      skip,
    } = this._paginate(page, limit);

    const where = { schoolId };
    if (studentId) where.studentId = studentId;

    const [items, total] = await prisma.$transaction([
      prisma.feeAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
      }),
      prisma.feeAuditLog.count({ where }),
    ]);

    return {
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
      items,
    };
  }

  async getScholarshipHistory(schoolId, studentId) {
    const logs = await prisma.feeAuditLog.findMany({
      where: {
        schoolId,
        entityType: "StudentScholarship",
        studentId,
      },
      orderBy: { createdAt: "desc" },
    });

    const scholarshipIds = logs.map((l) => l.entityId).filter(Boolean);
    if (scholarshipIds.length > 0) {
      const scholarships = await prisma.studentScholarship.findMany({
        where: { id: { in: scholarshipIds }, schoolId },
        include: { feeCategory: { select: { name: true } } },
      });
      const catMap = new Map(
        scholarships.map((s) => [
          s.id,
          s.feeCategory?.name || "All Applicable",
        ]),
      );

      return logs.map((log) => {
        if (log.entityId && catMap.has(log.entityId)) {
          return {
            ...log,
            meta: {
              ...(typeof log.meta === "object" && log.meta !== null
                ? log.meta
                : {}),
              feeCategory: catMap.get(log.entityId),
            },
          };
        }
        return log;
      });
    }

    return logs;
  }

  async getOverdueFees(schoolId, query) {
    const { page, limit, skip } = this._paginate(query.page, query.limit);
    const graceDays = await this._getGraceDays(schoolId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - graceDays);

    const where = {
      schoolId,
      dueDate: { lt: cutoffDate },
      balanceAmount: { gt: 0 },
    };

    const [items, total] = await prisma.$transaction([
      prisma.studentFee.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              enrollments: { include: { class: { select: { name: true } } } },
              parents: {
                include: {
                  user: { select: { name: true, email: true, phone: true } },
                },
              },
            },
          },
          feeStructure: {
            include: {
              feeCategory: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.studentFee.count({ where }),
    ]);

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      items,
    };
  }
}

module.exports = new FeeManagementService();
