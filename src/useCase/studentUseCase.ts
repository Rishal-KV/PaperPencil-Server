import IStudentRepo from "./interface/IStudentRepo";
import student from "../domain/student";
import GenerateOTP from "../infrastructure/utils/generateOtp";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env") });
import jwt from "jsonwebtoken";
import Jwt from "../infrastructure/utils/Jwt";
import Bcrypt from "../infrastructure/utils/bcrypt";
import Imailer from "./interface/IMailer";
import OtpRepo from "../infrastructure/repository/otpRepository";

class StudentUseCase {
  constructor(
    private generateOtp: GenerateOTP,
    private repository: IStudentRepo,
    private Jwt: Jwt,
    private bcrypt: Bcrypt,
    private sendmail: Imailer,
    private OtpRepo: OtpRepo
  ) {
    this.repository = repository;
    this.generateOtp = generateOtp;
    this.sendmail = sendmail;
    this.OtpRepo = OtpRepo;
    this.Jwt = Jwt;
  }
  async signUpAndSendOtp(studentData: student) {
    try {
      const studentFound = await this.repository.findStudentByEMail(
        studentData.email
      );
      if (studentFound) {
        if (!studentFound.is_Verified) {
          this.sendmail.sendVerificationMail(
            studentFound._id,
            studentFound.email
          );
          return {
            status: false,
            message: "please check your mail for verifying your account",
          };
        }
      }

      if (studentFound) {
        return { status: false, message: "student already exist" };
      } else {
        let payload: { email: string,role:string } = {
          email: studentData.email,
          role : "student"
        };
        let otp = this.generateOtp.generateOTP();
        this.sendmail.sendMail(studentData.email, parseInt(otp));
        let jwtToken = jwt.sign(payload, process.env.jwt_secret as string,{expiresIn:"1m"});
        this.OtpRepo.createOtpCollection(studentData.email, otp);
        let hashedPass = await this.bcrypt.hashPass(studentData.password);
        hashedPass ? (studentData.password = hashedPass) : "";

        await this.repository.saveStudentToDatabase(studentData);
        return { status: true, Token: jwtToken };
      }
    } catch (error) {
      throw error;
    }
  }

  async authenticate(token: string, otp: string) {
    try {
      let decodeToken = this.Jwt.verifyToken(token);
      console.log(decodeToken);
      
      if (decodeToken) {
        let fetchOtp = await this.OtpRepo.getOtpByEmail(decodeToken.email);
        console.log(fetchOtp);
        console.log(otp);
        
        if (fetchOtp) {
          if (fetchOtp.otp == otp) {
            
            let studentToken = this.Jwt.createToken(decodeToken._id, "student");
            let studentData = await this.repository.fetchStudentData(
              decodeToken.email
            );
            await this.repository.verifyStudent(decodeToken.email);
            return {
              status: true,
              token: studentToken,
              studentData: studentData,
            };
          } else {
            console.log("eheh");
            
            return { status: false, message: "invalid otp" };
          }
        } else {
          return { status: false, message: "otp has been expired!!!" };
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async loginStudent(email: string, password: string) {
    let studentFound = await this.repository.findStudentByEMail(email);
    console.log(studentFound);
    

    if (studentFound) {
      let student = await this.repository.fetchStudentData(email)
      if (!studentFound.is_Verified) {
        return { status: false, message: "Account is not verified!!" };
      }
      let verified = await this.bcrypt.encryptPass(
        password,
        studentFound.password
      );

      if (!verified) {
        return { status: false, message: "incorrect password" };
      } else if (studentFound.is_blocked) {
        return { status: false, message: "user is blocked" };
      } else {
        let token = this.Jwt.createToken(studentFound._id, "student");
        return {
          status: true,
          token: token,
          student: student,
          message: `welcome ${studentFound.name}`,
        };
      }
    } else {
      return { status: false, message: "please create an account" };
    }
  }

  async googleAuth(credential: any) {
    try {
      let { name, email } = credential;
      let studentFound = await this.repository.findStudentByEMail(email);

      if (studentFound) {
        if (studentFound.is_blocked) {
          console.log("blocked");

          return {
            status: false,
            message: `hey ${name} you are blocked by admin`,
          };
        } else {
          let studentData = await this.repository.fetchStudentData(email);
          let token = this.Jwt.createToken(studentData?._id, "student");
          return {
            status: true,
            message: `hey ${name} welcome back!!`,
            token,
            studentData,
          };
        }
      } else {
        let student = await this.repository.saveGoogleAuth(credential);
        let token = this.Jwt.createToken(student._id, "student");
        let studentData = await this.repository.fetchStudentData(email);
        return {
          status: true,
          message: `welcome ${name} let's learn logether`,
          token,
          studentData,
        };
      }
    } catch (error) {
      console.log(error);
    }
  }

  async verifyByEMail(id: string) {
    try {
      await this.repository.updateById(id);
    } catch (error) {
      console.log(error);
    }
  }
}

export default StudentUseCase;
