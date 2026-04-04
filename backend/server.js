const express = require("express");
const cors = require("cors");
const dashboardRoute = require("./routes/dashboard");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/dashboard", dashboardRoute);

app.get("/", (req, res) => {
  res.send("API Running");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});