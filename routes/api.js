const router = require("express").Router();
const Transaction = require("../models/transaction.js");

router.post("/api/transaction", ({ body }, res) => {
  console.log("Adding Transaction.");
  Transaction.create(body)
    .then((dbTransaction) => {
      console.log("Transactions added.");
      res.json(dbTransaction);
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});

router.post("/api/transaction/bulk", ({ body }, res) => {
  Transaction.insertMany(body)
    .then((dbTransaction) => {
      res.json(dbTransaction);
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});

router.get("/api/transaction", (req, res) => {
  console.log("Fetching Transaction.");
  Transaction.find({})
    .sort({ date: -1 })
    .then((dbTransaction) => {
      console.log("Transactions sent.");
      res.json(dbTransaction);
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});

module.exports = router;
