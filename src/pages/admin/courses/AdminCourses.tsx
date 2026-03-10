/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useFetchCourseOutlines, ICourse } from "../../../hooks/useFetchCourseOutlines";
import { Spinner, Button, Modal, TextInput, Select, Label } from "flowbite-react";
import { HiPlus, HiPencil, HiTrash, HiArrowLeft } from "react-icons/hi";
import { customButtonTheme } from "../../../themes/customButtton";

export default function AdminCourses() {
  const [selectedLevel, setSelectedLevel] = useState<string>("100");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    courseCode: "",
    courseTitle: "",
    creditUnit: 1,
    option: "Compulsory",
    semester: "First",
    level: "100",
  });

  const {
    courses,
    coursesLoading,
    coursesError,
    fetchCoursesByLevel,
    addCourse,
    updateCourse,
    deleteCourse,
  } = useFetchCourseOutlines();

  useEffect(() => {
    fetchCoursesByLevel(selectedLevel);
  }, [selectedLevel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "creditUnit" ? parseInt(value) : value,
    }));
  };

  const handleAddCourse = async () => {
    setIsSubmitting(true);
    const success = await addCourse({
      ...formData,
      level: selectedLevel,
    });
    setIsSubmitting(false);
    if (success) {
      setShowAddModal(false);
      resetForm();
      fetchCoursesByLevel(selectedLevel);
    }
  };

  const handleEditCourse = async () => {
    if (!selectedCourse?.id) return;
    setIsSubmitting(true);
    const success = await updateCourse(selectedCourse.id, formData);
    setIsSubmitting(false);
    if (success) {
      setShowEditModal(false);
      resetForm();
      fetchCoursesByLevel(selectedLevel);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse?.id) return;
    setIsSubmitting(true);
    const success = await deleteCourse(selectedCourse.id);
    setIsSubmitting(false);
    if (success) {
      setShowDeleteModal(false);
      setSelectedCourse(null);
      fetchCoursesByLevel(selectedLevel);
    }
  };

  const resetForm = () => {
    setFormData({
      courseCode: "",
      courseTitle: "",
      creditUnit: 1,
      option: "Compulsory",
      semester: "First",
      level: selectedLevel,
    });
    setSelectedCourse(null);
  };

  const openEditModal = (course: ICourse) => {
    setSelectedCourse(course);
    setFormData({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      creditUnit: course.creditUnit,
      option: course.option,
      semester: course.semester,
      level: course.level,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (course: ICourse) => {
    setSelectedCourse(course);
    setShowDeleteModal(true);
  };

  // Group courses by semester
  const firstSemesterCourses = courses?.filter((c) => c.semester === "First") || [];
  const secondSemesterCourses = courses?.filter((c) => c.semester === "Second") || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="pt-[80px] ss:pt-[90px] sm:pt-[105px] pb-10 px-4">
          <div className="flex items-center gap-4 mb-6">
            <NavLink
              to="/admin"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <HiArrowLeft className="w-5 h-5" />
              Back
            </NavLink>
          </div>

          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
              <p className="text-gray-600">Add, edit, and delete courses</p>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-32"
              >
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </Select>
              <Button
                theme={customButtonTheme}
                color="primary"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <HiPlus className="w-5 h-5 mr-2" />
                Add Course
              </Button>
            </div>
          </div>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="xl" />
            </div>
          ) : coursesError ? (
            <div className="text-center py-10">
              <p className="text-red-500">Failed to load courses. Please try again.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* First Semester */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  First Semester (Harmattan)
                </h2>
                {firstSemesterCourses.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No courses for first semester</p>
                ) : (
                  <div className="grid gap-4">
                    {firstSemesterCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {course.courseCode} - {course.courseTitle}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Credit Units: {course.creditUnit} | {course.option}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <NavLink to={`/admin/courses/${course.courseCode}/details`}>
                            <Button size="sm" color="light">
                              Details
                            </Button>
                          </NavLink>
                          <Button
                            size="sm"
                            color="light"
                            onClick={() => openEditModal(course)}
                          >
                            <HiPencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => openDeleteModal(course)}
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Second Semester */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Second Semester (Rain)
                </h2>
                {secondSemesterCourses.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No courses for second semester</p>
                ) : (
                  <div className="grid gap-4">
                    {secondSemesterCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {course.courseCode} - {course.courseTitle}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Credit Units: {course.creditUnit} | {course.option}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <NavLink to={`/admin/courses/${course.courseCode}/details`}>
                            <Button size="sm" color="light">
                              Details
                            </Button>
                          </NavLink>
                          <Button
                            size="sm"
                            color="light"
                            onClick={() => openEditModal(course)}
                          >
                            <HiPencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => openDeleteModal(course)}
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)}>
        <Modal.Header>Add New Course</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="courseCode">Course Code</Label>
              <TextInput
                id="courseCode"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleInputChange}
                placeholder="e.g., PTE 101"
                required
              />
            </div>
            <div>
              <Label htmlFor="courseTitle">Course Title</Label>
              <TextInput
                id="courseTitle"
                name="courseTitle"
                value={formData.courseTitle}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to Polymer Science"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creditUnit">Credit Units</Label>
                <TextInput
                  id="creditUnit"
                  name="creditUnit"
                  type="number"
                  min={1}
                  max={6}
                  value={formData.creditUnit}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="option">Option</Label>
                <Select
                  id="option"
                  name="option"
                  value={formData.option}
                  onChange={handleInputChange}
                >
                  <option value="Compulsory">Compulsory</option>
                  <option value="Elective">Elective</option>
                  <option value="Required">Required</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
              >
                <option value="First">First Semester</option>
                <option value="Second">Second Semester</option>
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            theme={customButtonTheme}
            color="primary"
            onClick={handleAddCourse}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner size="sm" /> : "Add Course"}
          </Button>
          <Button color="gray" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Course Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        <Modal.Header>Edit Course</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCourseCode">Course Code</Label>
              <TextInput
                id="editCourseCode"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleInputChange}
                placeholder="e.g., PTE 101"
                required
              />
            </div>
            <div>
              <Label htmlFor="editCourseTitle">Course Title</Label>
              <TextInput
                id="editCourseTitle"
                name="courseTitle"
                value={formData.courseTitle}
                onChange={handleInputChange}
                placeholder="e.g., Introduction to Polymer Science"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCreditUnit">Credit Units</Label>
                <TextInput
                  id="editCreditUnit"
                  name="creditUnit"
                  type="number"
                  min={1}
                  max={6}
                  value={formData.creditUnit}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editOption">Option</Label>
                <Select
                  id="editOption"
                  name="option"
                  value={formData.option}
                  onChange={handleInputChange}
                >
                  <option value="Compulsory">Compulsory</option>
                  <option value="Elective">Elective</option>
                  <option value="Required">Required</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="editSemester">Semester</Label>
              <Select
                id="editSemester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
              >
                <option value="First">First Semester</option>
                <option value="Second">Second Semester</option>
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            theme={customButtonTheme}
            color="primary"
            onClick={handleEditCourse}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner size="sm" /> : "Save Changes"}
          </Button>
          <Button color="gray" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
        <Modal.Header>Delete Course</Modal.Header>
        <Modal.Body>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{selectedCourse?.courseCode}</span>? This action cannot
            be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={handleDeleteCourse} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : "Delete"}
          </Button>
          <Button color="gray" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
