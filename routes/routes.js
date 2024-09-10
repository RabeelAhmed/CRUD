const express = require("express");
const router = express.Router();
const userSchema = require("../model/users");
const multer = require("multer");
const fs = require("fs");

// Image Upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); 
  },
});

var upload = multer({
  storage: storage,
}).single("image");


router.get("/", async (req, res) => {
  try {
   
    const users = await userSchema.find().sort({ createdAt: -1 }).exec();
    res.render("index", {
      title: "Home Page",
      users: users,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
});


// Insert User
router.post("/add", upload, async (req, res) => {
  try {
    const user = new userSchema({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: req.file.filename, 
    });

    await user.save(); 

    req.session.message = {
      type: "success",
      message: "User Added Successfully",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});


router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add Users" });
});

router.get("/edit/:id", async (req, res) => {
  try {
    const user = await userSchema.findById(req.params.id).exec(); 
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("edit_users", {
      title: "Edit User",
      user: user, 
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/update/:id", upload, async (req, res) => {
  let id = req.params.id;
  let new_image = "";

  if (req.file) {
    new_image = req.file.filename;
    try {
      fs.unlinkSync("./uploads/" + req.body.old_image); 
    } catch (err) {
      console.log(err);
    }
  } else {
    new_image = req.body.old_image;
  }

  try {
    await userSchema.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    });

    req.session.message = {
      type: "success",
      message: "User Updated Successfully!",
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

router.get("/delete/:id", async (req, res) => {
    let id = req.params.id;
    
    try {
       
        const result = await userSchema.findByIdAndDelete(id);

       
        if (result.image && result.image !== "") {
            try {
                fs.unlinkSync("./uploads/" + result.image);
            } catch (err) {
                console.error("Error deleting image:", err);
            }
        }

       
        req.session.message = {
            type: "success",
            message: "User Deleted Successfully!"
        };
        res.redirect("/");
    } catch (err) {
       
        console.error("Error deleting user:", err);
        res.json({ message: err.message });
    }
});

module.exports = router;
