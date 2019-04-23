import bcrypt from "bcrypt-nodejs";
import crypto from "crypto";
import mongoose from "mongoose";
import { ReturnObject } from "../util/common";
import { getNextSeqNo } from "../util/seqNoGenerator";
import { Logger } from "../util/logger";

const logger = new Logger("models.User");

const uuid = require("uuid/v4");

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;

  facebook: string;
  tokens: AuthToken[];

  profile: {
    name: string,
    gender: string,
    location: string,
    website: string,
    picture: string
  };
  creditBalance: mongoose.Types.Decimal128;

  comparePassword: comparePasswordFunction;
  gravatar: (size: number) => string;
}

type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;

export type AuthToken = {
  accessToken: string,
  kind: string
};

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  email: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  facebook: String,
  twitter: String,
  google: String,
  tokens: Array,

  profile: {
    name: String,
    gender: String,
    location: String,
    website: String,
    picture: String
  },

  creditBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.00"),
  },
}, { timestamps: true });


/**
 * Password hash middleware.
 */
UserSchema.pre("save", function save(next) {
  const user = <IUser>this;
  if (!user.isModified("password")) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
  const user = <IUser>this;
  bcrypt.compare(candidatePassword, user.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

UserSchema.methods.comparePassword = comparePassword;

/**
 * Helper method for getting user's gravatar.
 */
UserSchema.methods.gravatar = function (size: number) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash("md5").update(this.email).digest("hex");
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const UserModel: mongoose.Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default UserModel;


export async function transferCredit(from: string, to: string, amount: string): Promise<ReturnObject> {
  let error: Error;
  const mongodbSession = await mongoose.startSession();
  mongodbSession.startTransaction();
  try {
    const opts = { session: mongodbSession, new: true };

    let transferFrom = await UserModel.findById(from, {}, opts);
    if (!transferFrom) {
      error = new Error("Transfer Source [" + from + "] is invalid.");
      throw error;
    }

    transferFrom = await UserModel.findOneAndUpdate({ _id: from }, { $inc: { creditBalance: "-" + amount } }, opts);
    if (parseFloat(transferFrom.creditBalance.toString()) < 0) {
      error = new Error("Insufficient credits: " + (parseFloat(transferFrom.creditBalance.toString()) + parseFloat(amount)));
      throw error;
    }

    const seq01 = await getNextSeqNo("transferFromSeq", opts);
    logger.debug("Seq 1: " + seq01);

    let transferTo = await UserModel.findById(to, {}, opts);
    if (!transferTo) {
      error = new Error("Transfer Target [" + to + "] is invalid.");
      throw error;
    }

    transferTo = await UserModel.findOneAndUpdate({ _id: to }, { $inc: { creditBalance: amount } }, opts);

    const seq02 = await getNextSeqNo("transferToSeq", opts, 3);
    logger.debug("Seq 2: " + seq02);

    await mongodbSession.commitTransaction();
    mongodbSession.endSession();

    return { error: undefined, result: {from: transferFrom, to: transferTo } };
  } catch {
    await mongodbSession.abortTransaction();
    mongodbSession.endSession();
    return { error: error };
  }
}
