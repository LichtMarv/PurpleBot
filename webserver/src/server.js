const express = require("express");
const path = require("path");

class Server {
    constructor() {
        this.app = express();

        this.app.use("/static", express.static(path.join(__dirname,"../static")));

        this.app.get("/", (req,res)=>{
            res.sendFile("index.html", {root:path.join(__dirname,"../static")});
        });
    }

    start(port) {
        this.app.listen(8080);
        console.log("started");
    }
}

let s = new Server();
s.start(8080);