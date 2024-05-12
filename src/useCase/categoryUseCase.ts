import ICategory from "./interface/ICategory";
import CategoryRepo from "../infrastructure/repository/categoryRepo";
class CategoryUseCase {
  private CategoryRepo: CategoryRepo;
  constructor(category: CategoryRepo) {
    this.CategoryRepo = category;
  }
  async addCategory(name: string) {
    try {
      let category = await this.CategoryRepo.findCategory(name);

      if (category === null) {
        let categoryAdded = await this.CategoryRepo.saveCategory(name);
        if (categoryAdded) {
          return { status: true, message: "category added" };
        } else {
          return { status: false, message: "failed to add category" };
        }
      } else {
        return { status: false, message: "duplicate category" };
      }
    } catch (error) {
      console.log(error);
    }
  }

  async fetchCategory() {
    try {
      let category = await this.CategoryRepo.fetchCategory();
      if (category) {
        return { category: category };
      } else {
        return { status: false, message: "failed to fetch" };
      }
    } catch (error) {
      console.log(error);
    }
  }

  async actionCategory(id: string) {
    try {
      let actionResponse = await this.CategoryRepo.actionCategory(id);
      if (!actionResponse) {
        return { status: false, message: "unblocked successfuly" };
      } else {
        return { status: true, message: "blocked successfully" };
      }
    } catch (error) {
      console.log(error);
    }
  }
  async editCategory(catId: string, cat: string) {
    try {
      const response = await this.CategoryRepo.updateCategory(catId, cat);
  
      if (response) {
        return { status: true, message: "updated succesfully" };
      } else {
        return { status: false, message: "category already exist!!!" };
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getSpecific_category(id: string) {
    try {
      const response = await this.CategoryRepo.getSpecific_category(id);
      if (response) {
        return { status: true, category: response };
      } else {
        return { status: false, message: "failed to fetch" };
      }
    } catch (error) {
      console.log(error);
    }
  }
}

export default CategoryUseCase;
