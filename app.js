const express = require('express');
const bodyParser = require('body-parser');
const { default: mongoose } = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:admin@cluster0.k70jn.mongodb.net/")

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome"
});

const item2 = new Item({
    name: "Create"
});

const item3 = new Item({
    name: "Read"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema] 
};

const List = mongoose.model("List", listSchema);

app.get("/", async function(req, res){
    try {
        const foundItems = await Item.find({});
        
        if (foundItems.length === 0) {
            await Item.insertMany(defaultItems);
            console.log("successully added");
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    } catch (err) {
        console.log(err);
    }
});

app.post("/", async function(req, res){   
    try {
        const itemName = req.body.newItem;
        const listName = req.body.list;

        const item = new Item({
            name: itemName
        });

        if (listName === "Today"){
            await item.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.log(err);
    }
});


app.post("/delete", async function(req, res){
    try {
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName; // Make sure to retrieve the listName from the request

        if (listName === "Today") {
            await Item.findByIdAndDelete(checkedItemId);
            console.log("successfully deleted");
            res.redirect("/");
        } else {
            await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedItemId } } }
            );
            console.log("successfully deleted from custom list");
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.log(err);
    }
});

app.get("/:customListName", async function(req, res){
    try {
        const customListName = _.capitalize(req.params.customListName);
        const foundList = await List.findOne({ name: customListName }).exec();

        if (!foundList){
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            await list.save();
            res.redirect("/" + customListName);
        } else {
              res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
    } catch (err) {
        console.log(err);
    }
});




module.exports = app;

if (require.main === module) {
    app.listen(3000, () => console.log('Running locally on 3000!'));
  }
