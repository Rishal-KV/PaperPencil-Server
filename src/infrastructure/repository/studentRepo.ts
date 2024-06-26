import Instructor from "../../domain/instructor";
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
  async setStudent(name:string,email: string, password: string): Promise<void> {
    try {
       await studentModel.findOneAndUpdate({email:email},{
        $set :{
          name : name,
          password : password
        }
       })
    } catch (error) {
      throw error
    }
  }
  async fetchStudentData(email: string): Promise<student | null> {
    try {
      let student = await studentModel.findOne(
        { email },
        { email: 1, name: 1, profileImage:1,googleAuth : 1,about:1 }
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
  async saveGoogleAuth(credential: any): Promise<student> {
    try {
      let saved = await studentModel.create({
        name: credential.name,
        email: credential.email,
        is_Verified: true,
        googleId: credential.sub,
        profileImage: credential.picture,
        about: "",
        number: "",
        googleAuth : true
      });
      return saved;
    } catch (error) {
      throw error;
    }
  }
  async updateById(id: string): Promise<void> {
    try {
      await studentModel.findOneAndUpdate(
        { _id: id },
        {
          is_Verified: true,
        }
      );
    } catch (error) {
      throw error;
    }
  }
  async setForgotPassword(email: string, password: string): Promise<boolean> {
    try {
      let updated = await studentModel.findOneAndUpdate(
        { email: email },
        {
          password: password,
        }
      );
      if (updated) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw error;
    }
  }
  async getStudentById(id: string): Promise<student | null> {
    try {
      let data = await studentModel.findOne({ _id: id }).select("-password");
      if (data) {
        return data;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }
  async updateProfile(id: string, data: student): Promise<student | null> {
    try {
      let updated = await studentModel.findOneAndUpdate(
        { _id: id },
        {
          name: data.name,
          number: data.number,
          about: data.about,
          
        },
        { new: true }
      );
     if (updated) {
      return updated
     }else{
      return null
     }
    } catch (error) {
      throw error;
    }
  }
  async updateImage(id: string, image: any): Promise<student | null > {
    try {
      let updates = await studentModel.findOneAndUpdate(
        { _id: id },
        { profileImage: image.image },
        {
          new: true,           // Return the modified document rather than the original
          select: '-password'  // Exclude the password field
        }
      );
      
      
      if (updates) {
        return updates
      }else{
        return null
      }
    } catch (error) {
      throw error
    }
  }

  async updatePassword(email:string,password: string): Promise<boolean> {
    try {
      const updatePassword = await studentModel.findOneAndUpdate({email:email},{
        $set :{password:password}
      })
      if (updatePassword) {
        return true
      }else{
        return false
      }
    } catch (error) {
      throw error
    }
  }
}

export default StudentRepo;
