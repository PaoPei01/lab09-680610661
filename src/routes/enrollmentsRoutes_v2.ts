import { Router, type Response } from "express";

import { courses, enrollments } from "../db/db.ts";
import { type CustomRequest } from "../libs/types.ts";
import { authenticateToken } from "../middlewares/authenMiddleware.ts";
import { checkRoleStudent } from "../middlewares/checkRoleStudentMiddleware.ts";

const router = Router();

const getCourseNo = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object") return undefined;
  const value = (body as { courseNo?: unknown }).courseNo;
  return typeof value === "string" ? value : undefined;
};

router.get("/", authenticateToken, (req: CustomRequest, res: Response) => {
  if (req.user?.role === "ADMIN") {
    return res.status(200).json({
      ok: true,
      enrollments: enrollments.map((item) => ({
        studentId: item.studentId,
        courseNo: item.courseId,
      })),
    });
  }

  const studentId = req.user?.studentId;
  const registeredCourses = enrollments
    .filter((item) => item.studentId === studentId)
    .map((item) => {
      const course = courses.find((entry) => entry.courseId === item.courseId);
      return {
        courseNo: item.courseId,
        title: course?.courseTitle ?? "",
      };
    });

  return res.status(200).json({
    ok: true,
    courses: registeredCourses,
  });
});

router.post(
  "/",
  authenticateToken,
  checkRoleStudent,
  (req: CustomRequest, res: Response) => {
    const studentId = req.user?.studentId;
    const courseNo = getCourseNo(req.body);

    if (!studentId || !courseNo || courseNo.length !== 6) {
      return res.status(400).json({
        ok: false,
        message: "Please provide a valid courseNo",
      });
    }

    if (!courses.some((course) => course.courseId === courseNo)) {
      return res.status(404).json({
        ok: false,
        message: "Course does not exist",
      });
    }

    if (
      enrollments.some(
        (item) => item.studentId === studentId && item.courseId === courseNo
      )
    ) {
      return res.status(409).json({
        ok: false,
        message: "Enrollment already exists",
      });
    }

    enrollments.push({ studentId, courseId: courseNo });
    return res.status(201).json({
      ok: true,
      message: "Enrollment has been created",
      enrollment: { studentId, courseNo },
    });
  }
);

router.delete(
  "/",
  authenticateToken,
  checkRoleStudent,
  (req: CustomRequest, res: Response) => {
    const studentId = req.user?.studentId;
    const courseNo = getCourseNo(req.body);

    if (!studentId || !courseNo || courseNo.length !== 6) {
      return res.status(400).json({
        ok: false,
        message: "Please provide a valid courseNo",
      });
    }

    const enrollmentIndex = enrollments.findIndex(
      (item) => item.studentId === studentId && item.courseId === courseNo
    );

    if (enrollmentIndex === -1) {
      return res.status(404).json({
        ok: false,
        message: "Enrollment does not exist",
      });
    }

    enrollments.splice(enrollmentIndex, 1);
    return res.status(200).json({
      ok: true,
      message: "You has dropped from this course. See you next semester.",
    });
  }
);

export default router;
