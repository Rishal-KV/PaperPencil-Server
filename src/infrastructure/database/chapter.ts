import { Schema, model } from "mongoose";
import Chapter from "../../domain/chapter";
const ChapterSchema = new Schema<Chapter>({
  title: {
    type: String,
    required: true,
  },
  lessons: [
    {
      type: String,
      ref: "Lesson",
    },
  ],
  course: {
    type: String,
    ref: "Course",
  },
  order: {
    type: Number,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chapterModel = model<Chapter>("Chapter", ChapterSchema);
export default chapterModel;
