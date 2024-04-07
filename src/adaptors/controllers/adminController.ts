import { Request,Response } from "express";
import AdminUseCase from "../../useCase/adminUseCase";
class adminController{
    private adminUseCase:AdminUseCase
    constructor(adminUseCase:AdminUseCase){
       this.adminUseCase = adminUseCase
    }
   async adminLogin(req:Request,res:Response){
    try {
        const data = req.body;
        console.log(data);
        
        let foundAdmin = await this.adminUseCase.adminSignIn(data);
        if (foundAdmin?.status) {
            res.status(200).json({status:foundAdmin.status,token:foundAdmin.token})
        }else if(!foundAdmin?.status){
          
            
            res.status(401).json({status : foundAdmin?.status,message:"invalid password"})
        }else{
            res.json(404).json({noAdminFound:foundAdmin.adminFound})
        }
    } catch (error) {
         console.log(error);
         
    }
       
    }

    async getInstructorData(req:Request,res:Response){
     
        
        try {
            let userData = await this.adminUseCase.getInstructorData();
            if (userData) {
              
               
                
                res.status(200).json(userData)
                
                
            }else{
                res.status(401).json({message:"undable to fetch"})
            }
        } catch (error) {
            console.log(error);
            
        }
    }

    async getStudentData(req:Request,res:Response){
        try {
            let studentData = await this.adminUseCase.getStudentData();
            if (studentData) {
               
                
                
                res.status(200).json(studentData)
                
                
            }else{
                res.status(401).json({message:"undable to fetch"})
            }
        } catch (error) {
            
        }
    }

    async instructorAction(req:Request,res:Response){
        try {
            let {id} = req.body
            let actionstatus = await this.adminUseCase.blockInstructor(id)
            console.log(actionstatus);
            
            if (actionstatus) {
                res.status(200).json({status:actionstatus})
            }
            
        } catch (error) {
            console.log(error);
            
        }
    }

async studentAction(req:Request,res:Response){
    try {
        let {id} = req.body
        console.log(id);
        
        let actionStatus = this.adminUseCase.blockStudent(id);
        if (actionStatus) {
            res.status(200).json({success:actionStatus})
        }
    } catch (error) {
        console.log(error);
        
    }
}
    
}

export default adminController