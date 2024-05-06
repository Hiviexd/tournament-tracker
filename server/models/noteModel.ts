import mongoose, { Schema } from "mongoose";
import { INote, NoteType } from "../../interfaces/Note";

const NoteSchema = new Schema<INote>(
    {
        type: { type: String, enum: Object.values(NoteType), required: true },
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        target: { type: Schema.Types.ObjectId, refPath: "type", required: true },
        content: { type: String, required: true },
    }, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

NoteSchema.virtual("isUser").get(function (this: INote) {
    return this.type === NoteType.User;
});

NoteSchema.virtual("isTournament").get(function (this: INote) {
    return this.type === NoteType.Tournament;
});

const Note = mongoose.model<INote>("Note", NoteSchema);

export default Note;
