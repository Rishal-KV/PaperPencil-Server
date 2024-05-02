import Admin from "../../domain/admin";
import IAdminRepo from "../../useCase/interface/IAdminRepo";
import adminModel from "../database/admin";
import studentModel from "../database/studentModel";
import student from "../../domain/student";
import instructorModel from "../database/instructorModel";
import Course from "../../domain/course";
import courseModel from "../database/courseModel";
class AdminRepo implements IAdminRepo {
  async findAdminByEmail(email: string): Promise<Admin | null | void> {
    try {
      let adminData = await adminModel.findOne({ email: email });
      return adminData ? adminData.toObject() : null;
    } catch (error) {
      console.log(error);
    }
  }

  async findStudentData(): Promise<student[]> {
    try {
      let students = await studentModel.find();
      return students;
    } catch (error) {
      console.log(error);

      return [];
    }
  }

  async findInstructorData() {
    try {
      let instructors = await instructorModel.find();
      return instructors;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async blockInstructor(id: string): Promise<boolean> {
    try {
      let instructor = await instructorModel.findById(id);
      if (instructor?.is_blocked) {
        await instructorModel.findOneAndUpdate(
          { _id: id },
          {
            is_blocked: false,
          }
        );
        return true;
      } else {
        await instructorModel.findOneAndUpdate(
          { _id: id },
          {
            is_blocked: true,
          }
        );
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  async blockStudent(id: string): Promise<boolean> {
    try {
      let student = await studentModel.findById(id);

      if (student?.is_blocked) {
        let eheh = await studentModel.findOneAndUpdate(
          { _id: id },
          {
            is_blocked: false,
          },
          { new: true }
        );

        return true;
      } else {
        await studentModel.findOneAndUpdate(
          { _id: id },
          {
            is_blocked: true,
          }
        );
        return true;
      }
    } catch (error) {
      return false;
    }
  }
  async fetchCourse(): Promise<Course[] | null> {
    try {
      let course = await courseModel
        .find({ publish: true })
        .populate("instructor");
      if (course) {
        return course;
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }
}

export default AdminRepo;
