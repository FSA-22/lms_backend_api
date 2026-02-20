import { Router } from 'express';

const router = Router();

// GET /api/courses - Returns mock courses (your own contribution)
router.get('/', (req, res) => {
  const mockCourses = [
    {
      id: 1,
      title: "Introduction to JavaScript",
      description: "Learn the basics of JS for frontend and backend",
      instructor: "TS Academy Team",
      duration: "4 weeks",
      level: "Beginner"
    },
    {
      id: 2,
      title: "Node.js & Express Backend",
      description: "Build REST APIs with Node.js and Express",
      instructor: "TS Academy Team",
      duration: "6 weeks",
      level: "Intermediate"
    },
    {
      id: 3,
      title: "Supabase for Modern Apps",
      description: "Use Supabase as backend service (auth + DB)",
      instructor: "TS Academy Team",
      duration: "3 weeks",
      level: "Intermediate"
    }
  ];

  res.status(200).json({
    success: true,
    message: "Courses fetched successfully (Ugoo's endpoint)",
    data: mockCourses
  });
});

export default router;