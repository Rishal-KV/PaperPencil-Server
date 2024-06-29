import Instructor from "../domain/instructor";
import InstructorRepo from "../infrastructure/repository/instructorRepo";
import Jwt from "../infrastructure/utils/Jwt";
import GenerateOTP from "../infrastructure/utils/generateOtp";
import jwt from "jsonwebtoken";
import Imailer from "./interface/IMailer";
import Bcrypt from "../infrastructure/utils/bcrypt";
import OtpRepo from "../infrastructure/repository/otpRepository";
import cron from "node-cron";
class InstructorUseCase {
  private instructorRepo: InstructorRepo;

  private jwt: Jwt;
  private generateOtp: GenerateOTP;
  private sendmail: Imailer;
  private bcrypt: Bcrypt;
  private OtpRepo: OtpRepo;
  constructor(
    instructorRepo: InstructorRepo,
    jwt: Jwt,
    generateOtp: GenerateOTP,
    sendmail: Imailer,
    bcrypt: Bcrypt,
    otp: OtpRepo
  ) {
    this.instructorRepo = instructorRepo;
    this.jwt = jwt;
    this.generateOtp = generateOtp;
    this.sendmail = sendmail;
    this.bcrypt = bcrypt;
    this.OtpRepo = otp;
  }

  async signUpAndSendOtp(InstructorData: Instructor) {
    try {
      const instrcutorFound = await this.instructorRepo.findInstructorByEmail(
        InstructorData.email
      );

      if (instrcutorFound) {
        if (instrcutorFound && instrcutorFound.is_verified) {
          return { status: false, message: "instructor already exist" };
        }

        if (!instrcutorFound.is_verified) {
          const password = await this.bcrypt.hashPass(instrcutorFound.password);
          await this.instructorRepo.setInstructor(
            instrcutorFound.email,
            password as string
          );
          let otp = this.generateOtp.generateOTP();
          await this.sendmail.sendMail(InstructorData.email, parseInt(otp));
          await this.OtpRepo.createOtpCollection(InstructorData.email, otp);
          cron.schedule("* * * * *", async () => {
            await this.OtpRepo.removeOtp(InstructorData.email);
          });

          const payload: {
            email: string | undefined;
          } = {
            email: InstructorData?.email,
          };

          let jwtToken = jwt.sign(payload, process.env.jwt_secret as string);

          return { not_verified: true, Token: jwtToken };
        }
        console.log("no suer found");
        
      } else {
        console.log("no user");
        
        const otp = this.generateOtp.generateOTP();
        await this.sendmail.sendMail(InstructorData.email, parseInt(otp));
        await this.OtpRepo.createOtpCollection(InstructorData.email, otp);
        // cron.schedule("* * * * *", async () => {
        //   console.log("removed");
        //   await this.OtpRepo.removeOtp(InstructorData.email);
        // });
        await this.OtpRepo.createOtpCollection(InstructorData.email, otp);
        setTimeout(async () => {
          await this.OtpRepo.removeOtp(InstructorData.email);
        }, 60000); // 60,000 milliseconds = 1 minute
        // setTimeout(async()=>{
        //   await this.OtpRepo.removeOtp(InstructorData.email);
        // })

        const hashedPass = await this.bcrypt.hashPass(InstructorData.password);
        hashedPass ? (InstructorData.password = hashedPass) : "";
        let savedInstructor =
          await this.instructorRepo.saveInstructorToDatabase(InstructorData);
        const payload: {
          email: string | undefined;
          id: string;
        } = {
          email: savedInstructor?.email,
          id: savedInstructor?._id as string,
        };

        const jwtToken = jwt.sign(payload, process.env.jwt_secret as string);

        return { status: true, Token: jwtToken };
      }
    } catch (error) {
      throw error;
    }
  }

  async authenticate(token: string, otp: string) {
    console.log(otp);

    try {
      let decodeToken = this.jwt.verifyToken(token);
      console.log(decodeToken);

      if (decodeToken) {
        let fetchOtp = await this.OtpRepo.getOtpByEmail(decodeToken.email);
        let instructor = await this.instructorRepo.findInstructorByEmail(
          decodeToken.email
        );

        if (fetchOtp) {
          if (fetchOtp.otp == otp) {
            let instructorToken = this.jwt.createToken(
              instructor?._id,
              "instructor"
            );
            let instructorData = await this.instructorRepo.fetchInstructorData(
              decodeToken.email
            );

            const verified = await this.instructorRepo.verifyInstructor(
              decodeToken.email
            );
            console.log(verified, "verifie");

            return {
              status: true,
              token: instructorToken,
              instructorData: instructorData,
              message: `welcome ${instructorData?.name}`,
            };
          } else {
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

  async Login(instructorData: { email: string; password: string }) {
    let instructorDB = await this.instructorRepo.findInstructorByEmail(
      instructorData.email
    );

    if (instructorDB) {
      if (instructorDB.is_blocked) {
        return { status: false, message: "Account is blocked" };
      } else {
        let instructor = await this.instructorRepo.fetchInstructorData(
          instructorDB.email
        );

        let verifyPassword = await this.bcrypt.encryptPass(
          instructorData.password,
          instructorDB.password
        );
        if (verifyPassword) {
          let Token = this.jwt.createToken(instructor?._id, "instructor");
          return { status: true, token: Token, instructor: instructor };
        } else {
          return { status: false, message: "invalid password" };
        }
      }
    } else {
      return { status: false, message: "No account found" };
    }
  }
  async googleAuth(credential: any) {
    try {
      let { name, email } = credential;
      let instrcutorFound = await this.instructorRepo.findInstructorByEmail(
        email
      );
      if (instrcutorFound) {
        if (instrcutorFound.is_blocked) {
          console.log("blocked");

          return {
            status: false,
            message: `hey ${name} you are blocked by admin`,
          };
        } else {
          let instructorData = await this.instructorRepo.fetchInstructorData(
            email
          );
          let token = this.jwt.createToken(instrcutorFound._id, "instructor");
          return {
            status: true,
            message: `hey ${name} welcome back!!`,
            token,
            instructor: instructorData,
          };
        }
      } else {
        let instructor = await this.instructorRepo.saveGoogleAuth(credential);
        let instructorData = await this.instructorRepo.fetchInstructorData(
          instructor.email
        );
        let token = this.jwt.createToken(instructor._id, "instructor");
        return {
          status: true,
          instructor: instructorData,
          message: `welcome ${name} `,
          token,
        };
      }
    } catch (error) {
      throw error;
    }
  }
  async fetchProfile(email: string) {
    try {
      let instructor = this.instructorRepo.fetchInstructorData(email);
      return instructor;
    } catch (error) {
      console.log(error);
    }
  }
  async updateProfile(id: string, instructorData: Instructor) {
    try {
      const response = await this.instructorRepo.updateProfile(
        id,
        instructorData
      );
      return response
        ? { status: true, message: "updated succesfully", update: response }
        : { status: false, message: "failed to update" };
    } catch (error) {
      console.log(error);
    }
  }
  async updateImage(id: string, imageUrl: string) {
    try {
      const decodeToken = this.jwt.verifyToken(id);

      const response = await this.instructorRepo.updateImage(
        decodeToken?.id,
        imageUrl
      );
      if (response) {
        return { updated: response, message: "profile photo updated" };
      } else {
        return response;
      }
    } catch (error) {
      console.log(error);
    }
  }
  async resendOtp(token: string) {
    const decodeToken = this.jwt.verifyToken(token);
    if (decodeToken && decodeToken.email) {
      let otp = this.generateOtp.generateOTP();
      await this.OtpRepo.createOtpCollection(decodeToken.email, otp);
      await this.sendmail.sendMail(decodeToken.email, parseInt(otp));
      setTimeout(async () => {
        console.log("removed");

        await this.OtpRepo.removeOtp(decodeToken.email);
      }, 60 * 1000);
      return { status: true, message: "otp resend successfully" };
    }
  }

  async changePassword(password: string, email: string, newPassword: string) {
    try {
      const student = await this.instructorRepo.findInstructorByEmail(email);
      const verified = await this.bcrypt.encryptPass(
        password,
        student?.password
      );

      if (verified) {
        const hashedPass = await this.bcrypt.hashPass(newPassword);
        await this.instructorRepo.updatePassword(email, hashedPass as string);
        return { status: true, message: "password has been updated" };
      } else {
        return { status: false, message: "current password doesnt match!!!" };
      }
    } catch (error) {
      throw error;
    }
  }
}

export default InstructorUseCase;
