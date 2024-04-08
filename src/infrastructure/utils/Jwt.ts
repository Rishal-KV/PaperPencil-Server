import { sign, verify, JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path'
dotenv.config({path : path.resolve(__dirname, '../../.env')})
class Jwt {
    private secretKey: string;

    constructor() {
        // console.log('Initializing Jwt class...');
        // console.log('process.env.jwt_secret:', process.env);
        this.secretKey = process.env.jwt_secret || '';
        // console.log('this.secretKey:', this.secretKey);
    }

    createToken(payload : {name?:string,email:string,id:string}) {
        try {
          
            const token = sign(payload, this.secretKey);
            return token;
        } catch (error) {
            console.error('Error creating token:', error);
            throw error;
        }
    }

    verifyToken(token: string ): JwtPayload | null {
        try {
            const decoded = verify(token, this.secretKey) as JwtPayload;
            return decoded;
        } catch (error) {
            console.error('Error verifying token:', error);
            return null;
        }
    }
}

export default Jwt;
