const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const multer = require("multer");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: "todayIsAGoodDay",
    resave: true,
    saveUninitialized: true
}));
app.set("view engine", "ejs");

///////////////////////multer///////////////////////
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(
            null, __dirname + "/public/profileImages"
        )
    },
    filename: (req, file, cb) => {
        const uniqesuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqesuffix + '-' + file.originalname)
    }
});

let upload = multer({ storage: storage });


////////////////////////mongooseDatabase///////////////
mongoose.connect("mongodb://localhost:27017/Connect", { useUnifiedTopology: true, useNewUrlParser: true });
const userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    userName: String,
    password: String,
    profileImage: String,
    posts: []
});

const userModel = mongoose.model("user", userSchema)
//////////////////////////////////////////////////////////
app.listen(3000, () => {
    console.log("the servier is running using port 3000");
});

////////////////////////get///////////////////////////////
app.get("/", (req, res) => {
    res.render(__dirname + "/mainPages/index.ejs")
});

app.get("/home", async (req, res) => {
    if (req.session.user) {
        let doc = await userModel.findById(req.session.user._id);
        res.render(__dirname + "/mainPages/home", { user: req.session.user, posts: doc });
    }
    else
        res.redirect("/")
});


app.get("/editInfo", (req, res) => {
    if (req.session.user) {
        res.render(__dirname + "/mainPages/editInfo", { user: req.session.user })
    }
    else res.redirect("/")
});

////////////////////post///////////////////////////////////
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
            req.session.user = user;
            res.redirect("/home")
        }

    })
});

app.post("/login", (req, res) => {
    const { loginUserName, loginPassword } = req.body;
    userModel.findOne({ userName: loginUserName }, (err, doc) => {
        if (!doc) {
            res.send("no user name found")
        }
        else if (doc.password == loginPassword) {
            req.session.user = doc;
            res.redirect("/home");
        }
        else {
            res.redirect("/");
        }
    })
});

app.post("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.post("/editInfo", async (req, res) => {
    const { editInfoFirstName, editInfoLastName } = req.body;
    let doc = await userModel.findOneAndUpdate({ id: req.session.user._id },
        { firstName: editInfoFirstName, lastName: editInfoLastName },
        { new: true })
    req.session.user = doc
    res.redirect("editInfo");
});

app.post("/uploadImg", upload.single("profileImage"), async (req, res) => {
    let doc = await userModel.findOneAndUpdate({ id: req.session.user._id },
        { profileImage: req.file.filename }, { new: true });
    req.session.user = doc
    res.redirect("editInfo");
})

app.post("/addBlogPost", async (req, res) => {
    await userModel.updateOne({ _id: req.session.user._id }, { $push: { posts: req.body.postText } });
    res.redirect("/home");
})
