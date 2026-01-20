const { Schema, model } = require("mongoose");

const cohortSchema = new Schema({
  course: {
    type: String,
    enum: [
      "WDFT",
      "WDPT",
      "UIUXFT",
      "UIUXPT",
      "CSFT",
      "CSPT",
      "DATAFT",
      "DATAPT",
    ],
    required: [true, "Course is required."],
  },
  month: {
    type: String,
    enum: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    required: [true, "Month is required."],
  },
  year: {
    type: Number,
    required: [true, "Year is required."],
    min: 2000,
    max: 2100,
  },
  displayName: {
    type: String,
    get: function () {
      return `${this.course}-${this.month}-${this.year}`;
    },
  },
});
const Cohort = model("Cohort", cohortSchema);

module.exports = Cohort;
