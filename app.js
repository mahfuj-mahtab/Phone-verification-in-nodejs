const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
require('dotenv').config()


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({
    secret:"hello this is secret",
    resave:false,
    saveUninitialized:true,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000
      }
}))
mongoose.connect("mongodb://localhost/whatsappDB",{useNewUrlParser: true,useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('database connected');
});

const registerSchema = new mongoose.Schema({
    name: String,
    phone: Number,
    security:Number,
    isVerified:Boolean
})
const register = mongoose.model("Register", registerSchema);


app.get("/", (req, res) => {
    res.render("register");
})
app.post("/register", (req, res) => {
    var name = req.body.fullName;
    var phone = req.body.number;
    console.log(phone)
    register.find({ "phone": phone }, (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            if (result.length == 0) {
                console.log("hello")
                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;
                const client = require('twilio')(accountSid, authToken);
                var randomNumber = Math.floor(100000+Math.random()*900000);
                client.messages
                    .create({
                        body: `Your verification number is ${randomNumber}`,
                        from: process.env.TWILIO_ACCOUNT_NUMBER,
                        to: '+88' + String(phone)
                    })
                    .then(message => {
                        const user = new register({"name": name,"phone":phone,"security" : randomNumber,"isVerified": false})
                        user.save()
                        req.session.phone = +phone;
                        res.render("verification");
                        console.log(message.sid)
                    });
            }
        }

    })


})

app.post("/verification",(req,res)=>{
    let verificationNumber = req.body.verificationNumber;
    console.log(req.session.phone);
    register.find({"phone" : req.session.phone},(err,result)=>{
        
        if(verificationNumber == result[0].security){
            result[0].isVerified = true;
            res.redirect("profile/"+req.session.phone)
            
        }
    })

})

























app.listen(3000, (req, res) => {
    console.log("app started");
})