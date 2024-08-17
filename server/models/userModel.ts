import mongoose, { Schema } from "mongoose";
import moment from "moment";
import { IUser, IUserStatics, UserGroup, GameMode } from "../../interfaces/User";
import helpers from "../helpers";
import config from "../../config.json";

const UserSchema = new Schema<IUser, IUserStatics>(
    {
        osuId: { type: Number, required: true, unique: true },
        username: { type: String, required: true },
        groups: { type: [String], enum: Object.values(UserGroup), default: [UserGroup.User] },
        history: [
            {
                date: { type: Date, required: true },
                mode: { type: String, enum: Object.values(GameMode), required: true },
                group: { type: String, enum: Object.values(UserGroup), required: true },
                kind: { type: String, enum: ["join", "leave"], required: true },
            },
        ],
        discordId: { type: String },
        active: { type: Boolean, default: true },
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
    return this.groups && this.groups.includes(UserGroup.Tournaments);
});

UserSchema.virtual("isContestCommittee").get(function (this: IUser) {
    return this.groups && this.groups.includes(UserGroup.Contests);
});

UserSchema.virtual("isAdmin").get(function (this: IUser) {
    return this.groups && this.groups.includes(UserGroup.Admin);
});

UserSchema.virtual("isDev").get(function (this: IUser) {
    return config.devs.includes(this.osuId);
});

UserSchema.virtual("isCommittee").get(function (this: IUser) {
    return this.isTournamentCommittee || this.isContestCommittee;
});

UserSchema.virtual("tcDuration").get(function (this: IUser) {
    return getDuration(this, UserGroup.Tournaments);
});

UserSchema.virtual("ccDuration").get(function (this: IUser) {
    return getDuration(this, UserGroup.Contests);
});

UserSchema.statics.findByUsernameOrOsuId = function (this: IUserStatics, user: string | number) {
    const osuId = parseInt(user as string, 10);

    if (isNaN(osuId)) {
        return this.findOne({
            username: new RegExp("^" + helpers.escapeUsername(user as string) + "$", "i"),
        });
    } else {
        return this.findOne({ osuId });
    }
};

function getDuration(user: IUser, group: string): number {
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
        const i = leftHistory.findIndex((d) => d.date > history.date && d.mode === history.mode);
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
