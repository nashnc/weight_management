const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2"); // imported the mongoose-paginate

const dataSchema = new mongoose.Schema({
  weight: {
    // weight ah number ah edukurom
    type: Number,
    required: [true, "weight is required"],
  },
  date: {
    type: Date,// date edukurom
  },

  time: {
    type: Date, // time tha oru timpass ah
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ithu user id from session
});

dataSchema.plugin(mongoosePaginate); // use the plugin
const Data = mongoose.model("Data", dataSchema);

module.exports = Data;
