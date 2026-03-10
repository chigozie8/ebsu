/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { notifyUser } from "../helpers/notifyUser";

// Types for course outlines
export interface ICourseOutline {
  id?: string;
  level: string;
  icon: string;
  title: string;
}

export interface ICourse {
  id?: string;
  level: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  option: string;
}

export interface ICourseContent {
  heading: string | null;
  content: string | null;
}

export interface ICourseDetail {
  id?: string;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  creditUnits: string;
  preRequisite: string | null;
  level: string;
  semester: string;
  info: ICourseContent[];
}

export const useFetchCourseOutlines = () => {
  // State for course levels (100, 200, etc.)
  const [courseLevels, setCourseLevels] = useState<ICourseOutline[] | null>(null);
  const [courseLevelsLoading, setCourseLevelsLoading] = useState(true);
  const [courseLevelsError, setCourseLevelsError] = useState(false);

  // State for courses by level
  const [courses, setCourses] = useState<ICourse[] | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(false);

  // State for single course detail
  const [courseDetail, setCourseDetail] = useState<ICourseDetail | null>(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(true);
  const [courseDetailError, setCourseDetailError] = useState(false);

  // Collection references
  const levelsRef = collection(db, "courseLevels");
  const coursesRef = collection(db, "courses");
  const courseDetailsRef = collection(db, "courseDetails");

  // Fetch all course levels (100, 200, 300, etc.)
  const fetchCourseLevels = async () => {
    setCourseLevelsLoading(true);
    try {
      onSnapshot(
        query(levelsRef),
        (querySnapshot) => {
          const list: ICourseOutline[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as ICourseOutline);
          });
          // Sort by level
          list.sort((a, b) => parseInt(a.level) - parseInt(b.level));
          setCourseLevels(list);
          setCourseLevelsLoading(false);
        },
        (error: any) => {
          console.error("Error fetching course levels:", error);
          setCourseLevelsLoading(false);
          setCourseLevelsError(true);
        }
      );
    } catch (error) {
      console.error("Error in fetchCourseLevels:", error);
      setCourseLevelsLoading(false);
      setCourseLevelsError(true);
    }
  };

  // Fetch courses by level
  const fetchCoursesByLevel = async (level: string) => {
    setCoursesLoading(true);
    setCoursesError(false);
    try {
      const q = query(coursesRef, where("level", "==", level));
      onSnapshot(
        q,
        (querySnapshot) => {
          const list: ICourse[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as ICourse);
          });
          setCourses(list);
          setCoursesLoading(false);
        },
        (error: any) => {
          console.error("Error fetching courses:", error);
          setCoursesLoading(false);
          setCoursesError(true);
        }
      );
    } catch (error) {
      console.error("Error in fetchCoursesByLevel:", error);
      setCoursesLoading(false);
      setCoursesError(true);
    }
  };

  // Fetch single course detail by course code
  const fetchCourseDetail = async (courseCode: string) => {
    setCourseDetailLoading(true);
    setCourseDetailError(false);
    try {
      const q = query(courseDetailsRef, where("courseCode", "==", courseCode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        setCourseDetail({ ...docData.data(), id: docData.id } as ICourseDetail);
      } else {
        setCourseDetail(null);
      }
      setCourseDetailLoading(false);
    } catch (error) {
      console.error("Error fetching course detail:", error);
      setCourseDetailLoading(false);
      setCourseDetailError(true);
      notifyUser("error", "Failed to load course details. Please try again.");
    }
  };

  // Admin functions
  // Add a new course level
  const addCourseLevel = async (data: Omit<ICourseOutline, 'id'>) => {
    try {
      await addDoc(levelsRef, data);
      notifyUser("success", "Course level added successfully!");
      return true;
    } catch (error) {
      console.error("Error adding course level:", error);
      notifyUser("error", "Failed to add course level. Please try again.");
      return false;
    }
  };

  // Add a new course
  const addCourse = async (data: Omit<ICourse, 'id'>) => {
    try {
      await addDoc(coursesRef, data);
      notifyUser("success", "Course added successfully!");
      return true;
    } catch (error) {
      console.error("Error adding course:", error);
      notifyUser("error", "Failed to add course. Please try again.");
      return false;
    }
  };

  // Add course detail
  const addCourseDetail = async (data: Omit<ICourseDetail, 'id'>) => {
    try {
      await addDoc(courseDetailsRef, data);
      notifyUser("success", "Course detail added successfully!");
      return true;
    } catch (error) {
      console.error("Error adding course detail:", error);
      notifyUser("error", "Failed to add course detail. Please try again.");
      return false;
    }
  };

  // Update course level
  const updateCourseLevel = async (id: string, data: Partial<ICourseOutline>) => {
    try {
      const docRef = doc(db, "courseLevels", id);
      await updateDoc(docRef, data);
      notifyUser("success", "Course level updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating course level:", error);
      notifyUser("error", "Failed to update course level. Please try again.");
      return false;
    }
  };

  // Update course
  const updateCourse = async (id: string, data: Partial<ICourse>) => {
    try {
      const docRef = doc(db, "courses", id);
      await updateDoc(docRef, data);
      notifyUser("success", "Course updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating course:", error);
      notifyUser("error", "Failed to update course. Please try again.");
      return false;
    }
  };

  // Update course detail
  const updateCourseDetail = async (id: string, data: Partial<ICourseDetail>) => {
    try {
      const docRef = doc(db, "courseDetails", id);
      await updateDoc(docRef, data);
      notifyUser("success", "Course detail updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating course detail:", error);
      notifyUser("error", "Failed to update course detail. Please try again.");
      return false;
    }
  };

  // Delete course level
  const deleteCourseLevel = async (id: string) => {
    try {
      const docRef = doc(db, "courseLevels", id);
      await deleteDoc(docRef);
      notifyUser("success", "Course level deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting course level:", error);
      notifyUser("error", "Failed to delete course level. Please try again.");
      return false;
    }
  };

  // Delete course
  const deleteCourse = async (id: string) => {
    try {
      const docRef = doc(db, "courses", id);
      await deleteDoc(docRef);
      notifyUser("success", "Course deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting course:", error);
      notifyUser("error", "Failed to delete course. Please try again.");
      return false;
    }
  };

  // Delete course detail
  const deleteCourseDetail = async (id: string) => {
    try {
      const docRef = doc(db, "courseDetails", id);
      await deleteDoc(docRef);
      notifyUser("success", "Course detail deleted successfully!");
      return true;
    } catch (error) {
      console.error("Error deleting course detail:", error);
      notifyUser("error", "Failed to delete course detail. Please try again.");
      return false;
    }
  };

  return {
    // Course levels
    courseLevels,
    courseLevelsLoading,
    courseLevelsError,
    fetchCourseLevels,
    
    // Courses
    courses,
    coursesLoading,
    coursesError,
    fetchCoursesByLevel,
    
    // Course detail
    courseDetail,
    courseDetailLoading,
    courseDetailError,
    fetchCourseDetail,
    
    // Admin functions
    addCourseLevel,
    addCourse,
    addCourseDetail,
    updateCourseLevel,
    updateCourse,
    updateCourseDetail,
    deleteCourseLevel,
    deleteCourse,
    deleteCourseDetail,
  };
};
