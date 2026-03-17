import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import NotFound from "../pages/error/404/NotFound";
import LogoSpinner from "../components/loaders/FullLogoSpinner";
import { Navbar } from "../components/navbar/Navbar";
import ProtectedRoute from "./ProtectedRoute";


const AppRoutes = () => {
  const Login = lazy(() => import("../pages/auth/login"));
  const SignUp = lazy(() => import("../pages/auth/signup"));
  const ForgotPassword = lazy(() => import("../pages/auth/forgot-password"));
  const Home = lazy(() => import("../pages/home/Home"));
  const CourseOutline = lazy(
    () => import("../pages/academics/course-outlines/CourseOutline")
  );
  const CoursesOutline = lazy(
    () => import("../pages/academics/course-outlines/CoursesOutline")
  );
  const CourseInfo = lazy(
    () => import("../pages/academics/course-outlines/CourseInfo")
  );
  const LearningResources = lazy(
    () => import("../pages/academics/learning-resources/LearningResources")
  );
  const LearningResourcesCourses = lazy(
    () =>
      import("../pages/academics/learning-resources/LearningResourcesCourses")
  );
  const LearningResourcesContent = lazy(
    () =>
      import("../pages/academics/learning-resources/LearningResourcesContent")
  );
  const ExamTimetable = lazy(
    () => import("../pages/academics/exam-timetable/ExamTimetable")
  );
  const Blog = lazy(() => import("../pages/misc/blog/Blog"));
  const BlogPost = lazy(() => import("../pages/misc/blog/post/BlogPost"));
  const ProjectTeam = lazy(() => import("../pages/students/ProjectTeam"));
  const ClassReps = lazy(() => import("../pages/students/ClassReps"));
  const EventsPage = lazy(() => import("../pages/user/events/EventsPage"));
  
  // New EBSUMSA pages
  const EbsumsaTeam = lazy(() => import("../pages/students/EbsumsaTeam"));
  const PressTeam = lazy(() => import("../pages/students/PressTeam"));
  const Alumni = lazy(() => import("../pages/ebsumsa/Alumni"));
  const ProjectsShowcase = lazy(() => import("../pages/projects/ProjectsShowcase"));
  const ProjectDetails = lazy(() => import("../pages/projects/ProjectDetails"));
  const GalleryPage = lazy(() => import("../pages/gallery/GalleryPage"));
  
  const AboutUs = lazy(() => import("../pages/about/AboutUs"));
  const PhilosophyAndObjectives = lazy(() => import("../pages/about/P&A"));
  const Admission = lazy(() => import("../pages/about/Admission"));
  const Dashboard = lazy(() => import("../pages/user/dashboard/Dashboard"));
  const StudentProfile = lazy(
    () => import("../pages/user/profile/StudentProfile")
  );
  const DashboardCourseOutlines = lazy(
    () =>
      import(
        "../pages/user/dashboard/components/course-outlines/CourseOutlines"
      )
  );
  const DashboardLearningResources = lazy(
    () =>
      import(
        "../pages/user/dashboard/components/learning-resources/LearningResources"
      )
  );
  const IDCardRegistration = lazy(
    () => import("../pages/user/id-card/IDCardRegistration")
  );
  const IDCardPayment = lazy(
    () => import("../pages/user/id-card/IDCardPayment")
  );
  const AdminDashboard = lazy(
    () => import("../pages/admin/AdminDashboard")
  );
  const ResourcesPage = lazy(
    () => import("../pages/user/resources/ResourcesPage")
  );
  const AIAssistant = lazy(
    () => import("../pages/user/ai-assistant/AIAssistant")
  );
  const CommunityPage = lazy(
    () => import("../pages/user/community/CommunityPage")
  );
  const StudyAIPage = lazy(
    () => import("../pages/user/analytics/AnalyticsPage")
  );
  const StudentQuizDashboard = lazy(
    () => import("../pages/user/quiz/StudentQuizDashboard")
  );
  const QuizCardPage = lazy(
    () => import("../pages/user/quiz-card/QuizCardPage")
  );
  const AiNotesPage = lazy(
    () => import("../pages/user/ai-notes/AiNotesPage")
  );
  const PaymentPortal = lazy(
    () => import("../pages/payment/PaymentPortal")
  );
  const WalletPage = lazy(
    () => import("../pages/user/wallet/WalletPage")
  );
  const PremiumPage = lazy(
    () => import("../pages/user/premium/PremiumPage")
  );
  const PremiumDashboard = lazy(
    () => import("../pages/user/premium/PremiumDashboard")
  );

  return (
    <>
      <Navbar />
      <Suspense fallback={<LogoSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/course-outlines" element={<CourseOutline />} />
          <Route path="/course-outlines/:level" element={<CoursesOutline />} />
          <Route path="/course-outlines/:level/:id" element={<CourseInfo />} />
          <Route
            path="/learning-resources"
            element={<LearningResources />}
          />
          <Route
            path="/learning-resources/:level"
            element={<LearningResourcesCourses />}
          />{" "}
          <Route
            path={"/learning-resources/:level/:id/:courseTitle"}
            element={<LearningResourcesContent />}
          />
          <Route path="/exam-timetable" element={<ExamTimetable />} />
          <Route path="/blog" element={<Blog />} />
          <Route
            path="/blog/posts/:title/:postID/:postType"
            element={<BlogPost />}
          />
          <Route path="/students/project-team" element={<ProjectTeam />} />
          <Route
            path="/students/class-representatives"
            element={<ClassReps />}
          />
          
          {/* New EBSUMSA routes */}
          <Route path="/ebsumsa/team" element={<EbsumsaTeam />} />
          <Route path="/ebsumsa/press" element={<PressTeam />} />
          <Route path="/ebsumsa/alumni" element={<Alumni />} />
          <Route path="/projects" element={<ProjectsShowcase />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/payment" element={<PaymentPortal />} />
          
          <Route path="/about/about-us" element={<AboutUs />} />
          <Route
            path="/about/philosophy-and-objectives"
            element={<PhilosophyAndObjectives />}
          />
          <Route path="/about/admission" element={<Admission />} />
          <Route
            path="/u/profile"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/course-outlines"
            element={
              <ProtectedRoute>
                <DashboardCourseOutlines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/learning-resources"
            element={
              <ProtectedRoute>
                <DashboardLearningResources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/id-card-payment"
            element={
              <ProtectedRoute>
                <IDCardPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/id-card"
            element={
              <ProtectedRoute>
                <IDCardRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/resources"
            element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/ai-assistant"
            element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/community"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/study-ai"
            element={
              <ProtectedRoute>
                <StudyAIPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/quiz"
            element={
              <ProtectedRoute>
                <StudentQuizDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/quiz-card"
            element={
              <ProtectedRoute>
                <QuizCardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/ai-notes"
            element={
              <ProtectedRoute>
                <AiNotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/premium"
            element={
              <ProtectedRoute>
                <PremiumPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/premium/dashboard"
            element={
              <ProtectedRoute>
                <PremiumDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};
export default AppRoutes;
