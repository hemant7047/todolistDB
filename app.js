require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { urlencoded } = require("body-parser");
const _ = require("lodash");


const app = express();


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); //for css use in our server

// mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect(process.env.MONGO_URI);

const itemsSchema = {
    name: String
};

// const items = ["Buy Food", "Cook Food", "Eat food"];

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todoList"
});
const item2 = new Item({
    name: "Hit a + button to add a new item"
});
const item3 = new Item({
    name: "<-- Hit this to delete an item"
});



const defaultItem = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {

    Item.find({}, (err, foundItems) => {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItem, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully Saved a default items");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }

    });

});


app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);


    List.findOne({ name: customListName }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                // console.log("List Doesn't exits");
                const list = new List({
                    name: customListName,
                    items: defaultItem
                });
                list.save();
                res.redirect("/" + customListName);

            } else {
                // console.log("Exists!");
                if (foundList.items.length === 0) {
                    List.findOneAndUpdate({ name: customListName }, { items: defaultItem }, { new: true }, (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("succesfully inserted");
                        }
                    });
                    return res.redirect("/" + customListName);
                }
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });


});


function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/")
    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            foundList.items.push(item)
            foundList.save();

            sleep(500).then(() => {
                res.redirect("/" + listName);
            });

        });
    }

});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, (err) => {
            if (!err) {
                console.log("Succesfully deleted checked items");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, foundList) => {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});


app.get("/about", (req, res) => {
    res.render("about");
});

app.listen(3000, () => {
    console.log("Host is running");
});