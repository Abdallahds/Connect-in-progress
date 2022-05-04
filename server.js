const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");


mongoose.connect("mongodb://localhost:27017/Connect", { useUnifiedTopology: true, useNewUrlParser: true });
const userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    userName: String,
    password: String
})

const userModel = mongoose.model("user", userSchema)

app.listen(3000, () => {
    console.log("the servier is running using port 3000");
});



app.get("/", (req, res) => {
    res.render(__dirname + "/mainPages/index.ejs")
});

app.post("/signin", (req, res) => {
    const { firstName, lastName, userName, password } = req.body;

    userModel.find((err, doc) => {
        let userFound = false;
        doc.forEach(Element => {
            if (Element.userName == userName) {
                userFound = true
            }
        })
        if (userFound) {
            res.send("the userName has been used!!!!!")
        }
        else {
            const user = new userModel({
                firstName: firstName,
                lastName: lastName,
                userName: userName,
                password: password
            })
            user.save();
            res.send("user has been regestered");
        }

    })
});