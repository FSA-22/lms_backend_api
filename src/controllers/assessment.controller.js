import { prisma } from '../lib/prisma.js';

export const createAssessment = async (req, res, next) => {
  try {
    const { title, type, totalMarks } = req.body;
    const { tenantId, id: userId } = req.user;
    const { courseId } = req.params; // ✅ get from URL

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Verify course belongs to tenant and instructor
    const course = await prisma.course.findFirst({
      where: { id: courseId, tenantId, instructorId: userId, deletedAt: null }
    });

    if (!course) return res.status(404).json({ message: 'Course not found or not yours' });

    const assessment = await prisma.assessment.create({
      data: {
        tenantId, // Prisma can handle tenantId as scalar
        courseId, // now defined
        title,
        type,
        totalMarks
      }
    });

    res.status(201).json(assessment);
  } catch (error) {
    next(error);
  }
};

// ---------------------- GET ALL ASSESSMENTS ----------------------
export const getAssessments = async (req, res, next) => {
  try {
    const { tenantId } = req.user;

    const assessments = await prisma.assessment.findMany({
      where: { tenantId, deletedAt: null },
      include: { course: true }
    });

    res.json(assessments);
  } catch (error) {
    next(error);
  }
};

// ---------------------- GET ASSESSMENT BY ID ----------------------
export const getAssessmentById = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { assessmentId } = req.params;

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, tenantId, deletedAt: null },
      include: { course: true, results: { where: { deletedAt: null } } }
    });

    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    res.json(assessment);
  } catch (error) {
    next(error);
  }
};

// ---------------------- UPDATE ASSESSMENT ----------------------
export const updateAssessment = async (req, res, next) => {
  try {
    const { tenantId, id: userId, roles } = req.user;
    const { assessmentId } = req.params;
    const { title, type, totalMarks } = req.body;

    if (!roles.includes('INSTRUCTOR')) return res.status(403).json({ message: 'Unauthorized' });

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, tenantId, deletedAt: null },
      include: { course: true }
    });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    if (assessment.course.instructorId !== userId)
      return res.status(403).json({ message: 'Not allowed to update this assessment' });

    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: { title, type, totalMarks }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// ---------------------- DELETE ASSESSMENT (SOFT DELETE) ----------------------
export const deleteAssessment = async (req, res, next) => {
  try {
    const { tenantId, id: userId, roles } = req.user;
    const { assessmentId } = req.params;

    if (!roles.includes('INSTRUCTOR')) return res.status(403).json({ message: 'Unauthorized' });

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, tenantId, deletedAt: null },
      include: { course: true }
    });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    if (assessment.course.instructorId !== userId)
      return res.status(403).json({ message: 'Not allowed to delete this assessment' });

    // Soft delete with transaction
    await prisma.$transaction(async (tx) => {
      await tx.assessmentResult.updateMany({
        where: { assessmentId, deletedAt: null },
        data: { deletedAt: new Date() }
      });
      await tx.assessment.update({
        where: { id: assessmentId },
        data: { deletedAt: new Date() }
      });
    });

    res.json({ message: 'Assessment deleted successfully (soft delete)' });
  } catch (error) {
    next(error);
  }
};
