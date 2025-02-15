import mongoose, { Schema } from "mongoose";
import moment from "moment";
import { IUser, IUserStatics, UserGroup } from "../../interfaces/User";
import helpers from "../helpers";

const UserSchema = new Schema<IUser, IUserStatics>(
    {
        osuId: { type: Number, required: true, unique: true },
        username: { type: String, required: true },
        groups: { type: [String], default: ["user"] },
        history: [
            {
                date: { type: Date, required: true },
                group: { type: String, required: true },
                kind: { type: String, enum: ["join", "leave"], required: true },
            },
        ],
        discordId: { type: String },
        isActiveReviewer: { type: Boolean, default: true },
        inBag: { type: Boolean, default: true },
        coverUrl: { type: String },
        country: {
            code: { type: String },
            name: { type: String },
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.virtual("avatarUrl").get(function (this: IUser) {
    return `https://a.ppy.sh/${this.osuId}`;
});

UserSchema.virtual("isTournamentCommittee").get(function (this: IUser) {
    return this.groups && this.groups.includes("tc");
});

UserSchema.virtual("isContestCommittee").get(function (this: IUser) {
    return this.groups && this.groups.includes("cc");
});

UserSchema.virtual("isAdmin").get(function (this: IUser) {
    return this.groups && this.groups.includes("admin");
});

UserSchema.virtual("isCommittee").get(function (this: IUser) {
    return this.isTournamentCommittee || this.isContestCommittee;
});

UserSchema.virtual("isAlumni").get(function (this: IUser) {
    return this.groups && this.groups.includes("alm");
});

UserSchema.virtual("tcDuration").get(function (this: IUser) {
    return getDuration(this, "tc");
});

UserSchema.virtual("ccDuration").get(function (this: IUser) {
    return getDuration(this, "cc");
});

UserSchema.statics.findByUsernameOrOsuId = function (this: IUserStatics, userInput: string | number) {
    const osuId = parseInt(userInput as string, 10);

    if (isNaN(osuId)) {
        return this.findOne({
            username: new RegExp("^" + helpers.escapeUsername(userInput as string) + "$", "i"),
        });
    } else {
        return this.findOne({ osuId });
    }
};

function getDuration(user: IUser, group: UserGroup): number {
    if (!user.history) return 0;

    const targetHistory = user.history.filter((h) => h.group === group);

    let historyKind;

    for (let i = 0; i < targetHistory.length; i++) {
        const history = targetHistory[i];

        if (historyKind !== history.kind) {
            historyKind = history.kind;
        } else {
            if (history.kind == "join") targetHistory.splice(i, 1);
            else if (history.kind == "leave") targetHistory.splice(i + 1, 1);
        }
    }

    const joinedHistory = targetHistory.filter((h) => h.kind === "join");
    const leftHistory = targetHistory.filter((h) => h.kind === "leave");
    let duration = 0;
    let unendingDate;

    for (const history of joinedHistory) {
        const i = leftHistory.findIndex((d) => d.date > history.date);
        const leftDate = leftHistory[i];
        leftHistory.splice(i, 1);

        if (leftDate) {
            duration += moment(leftDate.date).diff(history.date, "days");
        } else {
            unendingDate = history.date;
        }
    }

    if (unendingDate) {
        duration += moment().diff(unendingDate, "days");
    }

    return duration;
}

const User = mongoose.model<IUser, IUserStatics>("User", UserSchema);

export default User;
