import mongoose from "mongoose";

const houseSchema = new mongoose.Schema({
  image: String,
  link: String,
  title: String,
  price: String,
  location: String,
  description: String,
  details: [String],
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

houseSchema.pre('save', function(next) {
  const now = new Date();
  this.updatedAt = now;
  if (!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

export const HouseYungChing = mongoose.model("house_yungching", houseSchema);
export const HouseSinyi = mongoose.model("house_sinyi", houseSchema);
export const HouseHbhousing = mongoose.model("house_hbhousing", houseSchema);
export const HouseCt = mongoose.model("house_ct", houseSchema);
export const HouseLand591 = mongoose.model("house_land_591", houseSchema);
