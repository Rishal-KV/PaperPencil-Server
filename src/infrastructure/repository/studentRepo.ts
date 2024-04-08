import student from "../../domain/student";
import IStudentRepo from "../../useCase/interface/IStudentRepo";
import studentModel from "../database/studentModel";

class StudentRepo implements IStudentRepo {
  async findStudentByEMail(email: string): Promise<student | null> {
    try {
      let studenFound = await studentModel.findOne({ email: email });
      return studenFound ? studenFound.toObject() : null;
    } catch (error: any) {
      console.log(error.message);
      throw new Error("unable to fetch student data");
    }
  }
  async saveStudentToDatabase(
    student: student
  ): Promise<student | void | null> {
    try {
      let savedStudent = new studentModel(student);
      savedStudent.save();

      return savedStudent ? savedStudent.toObject() : null;
    } catch (error) {
      console.log(error);
    }
  }
  async fetchStudentData(email: string): Promise<student | null> {
    try {
      let student = await studentModel.findOne(
        { email },
        { email: 1, name: 1 }
      );
      return student;
    } catch (error) {
      throw error;
    }
  }
  async verifyStudent(email: string): Promise<any> {
    await studentModel.findOneAndUpdate(
      { email: email },
      {
        is_Verified: true,
      }
    );
  }
  async saveGoogleAuth(credential: any): Promise<void> {
    try {
      let saved = await studentModel.create({
        name: credential.name,
        email: credential.email,
        is_Verified : true,
        googleId: credential.sub,
      });
    } catch (error) {
      throw error;
    }
  }
  async updateById(id: string): Promise<void> {
     try {
        await studentModel.findOneAndUpdate({_id : id},{
          is_Verified : true
        })
     } catch (error) {
       throw error
     }
  }
}

export default StudentRepo;
