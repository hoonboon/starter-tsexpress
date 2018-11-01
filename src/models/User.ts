import bcrypt from "bcrypt-nodejs";
import crypto from "crypto";
import { Document, Schema, Error as MongooseError, model, Model } from "mongoose";

const uuid = require("uuid/v4");

export interface IUser extends Document {
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

  comparePassword: comparePasswordFunction;
  gravatar: (size: number) => string;
}

type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;

export type AuthToken = {
  accessToken: string,
  kind: string
};

const UserSchema = new Schema({
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
  }
}, { timestamps: true });


/**
 * Password hash middleware.
 */
UserSchema.pre("save", function save(next) {
  const user = <IUser>this;
  if (!user.isModified("password")) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, undefined, (err: MongooseError, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
  const user = <IUser>this;
  bcrypt.compare(candidatePassword, user.password, (err: MongooseError, isMatch: boolean) => {
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
const UserModel: Model<IUser> = model<IUser>("User", UserSchema);
export default UserModel;
