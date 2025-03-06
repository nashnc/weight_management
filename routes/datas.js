var express = require("express");
var router = express.Router();
const Data = require("../models/dataModel");
const moment = require("moment");

// Import required packages
const ejs = require("ejs");
// get request for creating a weight data
router
  .get("/create", (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    res.render("./data/create", { error: null });
  }) // post request for creating entry
  .post("/create", (req, res) => {
    // a session is created and checks for if the user of session is valid or logged in
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const { weight, date = new Date() } = req.body; // getting date

    // Strip out the time from the provided date to reduce duplications
    const dateOnly = new Date(date.setHours(0, 0, 0, 0));

    // cheking weight entry for the day
    Data.findOne({
      userId: req.session.userId, //to filter user
      date: {
        $gte: dateOnly, // comparing date with greater than less than
        $lt: new Date(dateOnly).setDate(dateOnly.getDate() + 1),
      },
    }) //if dplicates
      .then((existingData) => {
        if (existingData) {
          return res.render("./data/create", {
            error: "Weight already recorded for this date",

            // ennamo etho
            alertScript:
              '<script>alert("Weight entry already added for Today!");</script>',
          });
        }
        const time = new Date();

        const data = new Data({
          userId: req.session.userId,
          weight,
          date: dateOnly,
          time,
        }); // setting data to be stored into  the database

        const validationError = data.validateSync();
        if (validationError) {
          return res.render("./data/create", { error: validationError.errors });
        } else {
          data //saving the data to dbs
            .save()
            .then(() => {
              res.redirect("/");
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Server error");
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Server error");
      });
  });
//edit panna than
router
  .get("/update/:id", (req, res) => {
    const dataId = req.params.id; // edit panra enry oda id
    Data.findById(dataId) //
      .lean() // ithu vanthu object la irnthu just id mattum fetch panni eduka thaa
      .then((data) => {
        res.render("./data/update", { data: data, error: null });
      })
      .catch((error) => {
        console.error(error);
      });
  })
  .post("/update/:id", (req, res) => {
    const dataId = req.params.id;
    const { weight, date } = req.body; // weight ah tookirom change panna panna

    const userId = req.session.userId;
    const data = new Data({ weight, date, userId }); //data as obj store
    const validationError = data.validateSync();

    if (validationError) {
      res.render("./data/update", {
        data: data,
        error: validationError.errors,
      });
    } else {
      //so inga tha start aguthu
      const time = new Date(); // update pannum both time update panna tha
      Data.findByIdAndUpdate(dataId, { weight, date, userId, time }) // itu id find panni new data update pannum
        .then(() => {
          res.redirect("/datas/list"); // Redirect to the data list after updating
        }) //ithu update
        .catch((error) => {
          console.error(error);
          res.status(500).send("An error occurred while updating the data.");
        });
    }
  });
router // ithu id base la oru weight entry delete panna tha
  .get("/delete/:id", (req, res) => {
    const dataId = req.params.id;
    Data.findById(dataId)
      .then((data) => {
        res.render("./data/delete", { data: data });
      })
      .catch((error) => {
        console.error(error);
      });
  })
  .post("/delete/:id", (req, res) => {
    const dataId = req.params.id;
    Data.findByIdAndDelete(dataId)
      .then(() => {
        // find and delete by id use panni delte pannitom
        res.redirect("/datas/list");
      })
      .catch((error) => {
        console.error(error);
      });
  });
router.get("/list", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const { page = 1, limit = 3 } = req.query;
  //pagenationn
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  const query = { userId: req.session.userId };
  Data.paginate(query, options)
    .then((result) => {
      res.render("data/list", { data: result.docs, pagination: result });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }); // pagaiation
});

router
  .get("/cal", (req, res) => {
    if (!req.session.userId) return res.redirect("/login");
    res.render("./data/cal", { error: null });
  })
  .post("/cal", async (req, res) => {
    if (!req.session.userId) return res.redirect("/login");

    const { datefirst, datenext } = req.body; //input la irnthu date get panrom

    const dateFirst = moment(datefirst).startOf("day").toDate(); //atha convert panrom
    const dateNext = moment(datenext).endOf("day").toDate();
    const warning = ` please enter smaller date as first date and larger date as second date`;

    if (dateFirst > dateNext) {
      res.render("./data/result", {
        warning,
        result: null,
        error: null,
      });
    }
    Data.find({
      userId: req.session.userId,
      date: { $gte: dateFirst, $lte: dateNext }, //userId base la search panrom series aha
    })

      .sort({ date: -1 }) //decenting la sort panna tha
      .then((weights) => {
        const weightFirst =
          weights.length > 0 ? weights[weights.length - 1].weight : null; //  lenth lase last la irupathu print panrom
        const weightNext = weights.length > 0 ? weights[0].weight : null; // lenth la  frist irupathu print panrom

        const weightDiff = weightNext - weightFirst; // substracctn  tha
        console.log(`first weight ${weightFirst}`);
        console.log(`first tow ${weightNext}`);
        console.log(`total weight ${weightDiff}`);
        let result = //resut la   print panrom
          weightDiff == 0
            ? `sadly no changes ,but we appreciate your effort keep it going`
            : weightDiff > 0
            ? `you have gained ${weightDiff}  you need more effort `
            : `you have lost${weightDiff} wow amazing`;
        console.log(result);

        res.render("./data/result", {
          result,
          warning: null,
          error: null,
        });
      });
  });

module.exports = router;
