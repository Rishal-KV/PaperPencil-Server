"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, ".env") });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class StudentUseCase {
    generateOtp;
    repository;
    Jwt;
    bcrypt;
    sendmail;
    OtpRepo;
    courseRepo;
    constructor(generateOtp, repository, Jwt, bcrypt, sendmail, OtpRepo, courseRepo) {
        this.generateOtp = generateOtp;
        this.repository = repository;
        this.Jwt = Jwt;
        this.bcrypt = bcrypt;
        this.sendmail = sendmail;
        this.OtpRepo = OtpRepo;
        this.courseRepo = courseRepo;
        this.repository = repository;
        this.generateOtp = generateOtp;
        this.sendmail = sendmail;
        this.OtpRepo = OtpRepo;
        this.Jwt = Jwt;
        this.courseRepo = courseRepo;
    }
    async signUpAndSendOtp(studentData) {
        try {
            const studentFound = await this.repository.findStudentByEMail(studentData.email);
            if (studentFound) {
                if (!studentFound.is_Verified) {
                    this.sendmail.sendVerificationMail(studentFound._id, studentFound.email);
                    return {
                        status: false,
                        message: "please check your mail for verifying your account",
                    };
                }
            }
            if (studentFound) {
                return { status: false, message: "student already exist" };
            }
            else {
                let payload = {
                    email: studentData.email,
                    role: "student",
                };
                let otp = this.generateOtp.generateOTP();
                this.sendmail.sendMail(studentData.email, parseInt(otp));
                setTimeout(async () => {
                    console.log("removed");
                    await this.OtpRepo.removeOtp(studentData.email);
                }, 60 * 1000);
                let jwtToken = jsonwebtoken_1.default.sign(payload, process.env.jwt_secret);
                this.OtpRepo.createOtpCollection(studentData.email, otp);
                let hashedPass = await this.bcrypt.hashPass(studentData.password);
                hashedPass ? (studentData.password = hashedPass) : "";
                await this.repository.saveStudentToDatabase(studentData);
                return { status: true, Token: jwtToken };
            }
        }
        catch (error) {
            throw error;
        }
    }
    async authenticate(token, otp) {
        try {
            let decodeToken = this.Jwt.verifyToken(token);
            if (decodeToken) {
                let fetchOtp = await this.OtpRepo.getOtpByEmail(decodeToken.email);
                if (fetchOtp) {
                    if (fetchOtp.otp == otp) {
                        let studentToken = this.Jwt.createToken(decodeToken._id, "student");
                        let studentData = await this.repository.fetchStudentData(decodeToken.email);
                        await this.repository.verifyStudent(decodeToken.email);
                        return {
                            status: true,
                            token: studentToken,
                            studentData: studentData,
                        };
                    }
                    else {
                        return { status: false, message: "invalid otp" };
                    }
                }
                else {
                    return { status: false, message: "otp has been expired!!!" };
                }
            }
        }
        catch (error) {
            throw error;
        }
    }
    async loginStudent(email, password) {
        let studentFound = await this.repository.findStudentByEMail(email);
        if (studentFound) {
            let student = await this.repository.fetchStudentData(email);
            if (!studentFound.is_Verified) {
                return { status: false, message: "Account is not verified!!" };
            }
            let verified = await this.bcrypt.encryptPass(password, studentFound.password);
            if (!verified) {
                return { status: false, message: "incorrect password" };
            }
            else if (studentFound.is_blocked) {
                return { status: false, message: "user is blocked" };
            }
            else {
                let token = this.Jwt.createToken(studentFound._id, "student");
                return {
                    status: true,
                    token: token,
                    student: student,
                    message: `welcome ${studentFound.name}`,
                };
            }
        }
        else {
            return { status: false, message: "please create an account" };
        }
    }
    async googleAuth(credential) {
        try {
            console.log(credential);
            let { name, email } = credential;
            let studentFound = await this.repository.findStudentByEMail(email);
            if (studentFound) {
                if (studentFound.is_blocked) {
                    return {
                        status: false,
                        message: `hey ${name} you are blocked by admin`,
                    };
                }
                else {
                    let studentData = await this.repository.fetchStudentData(email);
                    let token = this.Jwt.createToken(studentData?._id, "student");
                    return {
                        status: true,
                        message: `hey ${name} welcome back!!`,
                        token,
                        studentData,
                    };
                }
            }
            else {
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
        }
        catch (error) {
            console.log(error);
        }
    }
    async verifyByEMail(id) {
        try {
            await this.repository.updateById(id);
        }
        catch (error) {
            console.log(error);
        }
    }
    async forgotPassword(email) {
        try {
            let student = await this.repository.findStudentByEMail(email);
            if (student) {
                const otp = this.generateOtp.generateOTP();
                this.OtpRepo.createOtpCollection(student.email, otp);
                await this.sendmail.sendMail(student.email, parseInt(otp));
                return { status: true, student: student.email };
            }
            else {
                return { status: false, message: "no student found" };
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async setForgotPassword(email, password) {
        try {
            let becryptedPassword = await this.bcrypt.hashPass(password);
            if (typeof becryptedPassword == "string") {
                let updated = await this.repository.setForgotPassword(email, becryptedPassword);
                if (updated) {
                    return { status: true, message: "password changed successfully" };
                }
                else {
                    return { status: false, message: "failed to change password" };
                }
            }
            else {
                console.log("failed to encrypt");
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async get_studentData(studentId) {
        try {
            let data = await this.repository.getStudentById(studentId);
            if (data) {
                return { status: true, student: data };
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async updateProfile(token, data) {
        try {
            let decryptedToken = this.Jwt.verifyToken(token);
            let updated = await this.repository.updateProfile(decryptedToken?.id, data);
            if (updated) {
                return { status: true, message: "profile updated successfully" };
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async updateImage(token, image) {
        try {
            let decodeToken = this.Jwt.verifyToken(token);
            let response = await this.repository.updateImage(decodeToken?.id, image);
            if (response) {
                return { status: true, message: "image updated successfully" };
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async confirmForgotOtp(email, otp) {
        try {
            console.log(otp);
            const response = await this.OtpRepo.getOtpByEmail(email);
            console.log(response);
            if (response) {
                if (response.otp == otp) {
                    return { status: true };
                }
                else {
                    return { status: false, message: "incorrect otp!!!" };
                }
            }
            else {
                return { status: false, message: "otp has been expired" };
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async resendOtp(token) {
        const decodeToken = this.Jwt.verifyToken(token);
        if (decodeToken && decodeToken.email) {
            let otp = this.generateOtp.generateOTP();
            this.OtpRepo.createOtpCollection(decodeToken.email, otp);
            this.sendmail.sendMail(decodeToken.email, parseInt(otp));
            return { status: true, message: "otp resend successfully" };
        }
    }
}
exports.default = StudentUseCase;
