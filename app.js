const express = require('express')
const bodyParser = require("body-parser")
const axios = require("axios")
const sgMail = require("@sendgrid/mail")
const inputValidator = require("./middlewares/inputvalidator")
let flash = require('connect-flash');
let session = require('express-session');

require("dotenv").config()

const API_KEY = process.env.SENDGRID_API_KEY
sgMail.setApiKey(API_KEY)


const PORT = 9000
const app = express()
const reciever_email = []
const verdict = []

// Middleware and setup
app.use(express.static(__dirname + "/Public"));  
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SECRET,
  cookie: { maxAge : 60000 },
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

app.set('views', __dirname + '/views');
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/Public'));

app.get("/", (req, res) => {
  res.render("index")
})

app.post("/question", (req, res) => {
  const reciever = req.body.reciever_email
  const validateEmail = (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/).test(reciever) 
  if(!validateEmail) return res.render("error",{errorMessage: "email validation failed!"})

  reciever_email.push(reciever)
  req.flash("message", "");
  res.render("questions", {message: req.flash('message')});
})

app.post("/result", inputValidator, async (req, res) => {
  let p = (parseFloat(req.body.avalue) + parseFloat(req.body.bvalue) + parseFloat(req.body.cvalue) + parseFloat(req.body.dvalue)) / 2
  let e = (parseFloat(req.body.evalue) + parseFloat(req.body.fvalue) + parseFloat(req.body.gvalue) + parseFloat(req.body.hvalue)) / 2
  let r = (parseFloat(req.body.ivalue) + parseFloat(req.body.jvalue) + parseFloat(req.body.kvalue) + parseFloat(req.body.lvalue)) / 2
  let m = (parseFloat(req.body.mvalue) + parseFloat(req.body.nvalue) + parseFloat(req.body.ovalue) + parseFloat(req.body.pvalue)) / 2
  let a = (parseFloat(req.body.qvalue) + parseFloat(req.body.rvalue) + parseFloat(req.body.svalue) + parseFloat(req.body.tvalue)) / 2

  let recommendations = '';
  let badge = '';

  // Personalized recommendations and badge based on PERMA scores
  if (p < e && p < r && p < m && p < a) {
    verdict.push("Your positive emotions seem to be low. Focus on activities that bring joy.")
    recommendations = "We recommend you try mindfulness exercises or spend time in nature to boost positive emotions.";
    badge = "Low Positive Emotions Badge";
  } else if (r < p && r < e && r < m && r < a) {
    verdict.push("Your relationships could use some nurturing. Build stronger social ties.");
    recommendations = "Try engaging more with friends or join social activities to improve relationships.";
    badge = "Low Relationships Badge";
  } else if (e < r && e < m && e < p && e < a) {
    verdict.push("Your engagement levels are low. Try to find activities that bring you flow.");
    recommendations = "Consider picking up hobbies or projects that you feel passionate about to increase engagement.";
    badge = "Low Engagement Badge";
  } else if (m < r && m < p && m < e && m < a) {
    verdict.push("You seem to be searching for meaning. Explore your passions and goals.");
    recommendations = "Try setting goals aligned with your core values to increase your sense of purpose.";
    badge = "Low Meaning Badge";
  } else if (a < r && a < p && a < m && a < e) {
    verdict.push("Your accomplishments are low. Focus on setting achievable goals.");
    recommendations = "Start by setting small, achievable goals that can give you a sense of accomplishment.";
    badge = "Low Accomplishment Badge";
  }

  if (isNaN(p) || isNaN(e) || isNaN(r) || isNaN(m) || isNaN(a)) {
    res.render("error", { errorMessage: "Please complete all questions to unveil your PERMA Score." })
  } else {
    const message = {
      to: reciever_email.pop(),
      from: process.env.FROM,
      subject: "Euphoria Check Results",
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: 'Poppins', sans-serif;
                background-color: #f4f4f4;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 30px auto;
                padding: 30px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
              }
              h1 {
                color: #007bff;
              }
              .cta-button {
                padding: 12px 24px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 16px;
              }
              .badge {
                font-size: 16px;
                color: #fff;
                background-color: #28a745;
                padding: 5px 10px;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Your PERMA Results</h1>
              <p>Positive Emotions: ${p}</p>
              <p>Engagement: ${e}</p>
              <p>Relationships: ${r}</p>
              <p>Meaning: ${m}</p>
              <p>Accomplishment: ${a}</p>
              <p><strong>Verdict:</strong> ${verdict.slice(-1)}</p>
              <p><strong>Recommendation:</strong> ${recommendations}</p>
              <p class="badge">${badge}</p>
              <a href="https://yourwebsite.com" class="cta-button">Visit our website</a>
            </div>
          </body>
        </html>
      `,
    };
    
    await sgMail
      .send(message)
      .then((response) => console.log("Email sent!"))
      .catch((error) => console.log(error.message));

    res.render("result", { pos: p, eng: e, mea: m, rel: r, acc: a, recommendations, badge });
  }
})

app.get("/mood-tracker", (req, res) => {
  res.render("mood-tracker");
});

app.post("/mood-tracker", (req, res) => {
  const { mood } = req.body;
  // Logic to save the mood in a database or session for tracking progress
  res.redirect("/result");
});

app.listen(process.env.PORT || 8000, function () {
  console.log("Server Started Successfully")
});
