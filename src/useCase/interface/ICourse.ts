import Course from "../../domain/course"
interface Icourse {
  saveCourseToDataBase(course:Course,instructor:string):Promise<Boolean>
  fetchCourseById(id:string):Promise<Course[] | null>
  fetchCourse():Promise<Course[] | null>
  updateById(id:string):Promise<boolean>
}
export default Icourse;