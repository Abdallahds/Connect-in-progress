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
    profileImage: String
});
const userModel = mongoose.model("user", userSchema);


const postSchema = mongoose.Schema({
    post: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: userModel }
})


const postModel = mongoose.model("post", postSchema);
//////////////////////////////////////////////////////////
app.listen(3000, () => {
    console.log("the server is running using port 3000");
});

////////////////////////get///////////////////////////////
app.get("/", (req, res) => {
    res.render(__dirname + "/mainPages/index.ejs")
});

app.get("/home", async (req, res) => {
    if (req.session.user) {
        let posts = await postModel.find({ id: req.session.user._id }).populate("owner", "firstName lastName profileImage")
        res.render(__dirname + "/mainPages/home", { user: req.session.user, posts: posts });
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
app.get("/friends", (req, res) => {
    if (req.session.user) {
        res.render(__dirname + "/mainPages/friends", { user: req.session.user })
    }
})

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
            res.send("the userName has already been used!!!!!")
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
    if (req.session.user) {
        let user = await userModel.findById(req.session.user._id);
        const post = await new postModel({
            post: req.body.postText,
            owner: user
        })
        post.save();
    }
    res.redirect("/home");
})
