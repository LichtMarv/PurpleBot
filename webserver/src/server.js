const express = require("express");
const app = express();
const path = require("path");

app.get("/", (req,res)=>{
    res.sendFile("index.html", {root:path.join(__dirname,"../static")});
});

app.listen(8080);