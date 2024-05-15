const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.port || 5000;
//middle ware setup
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.1.107:5173",
      "https://assignment-11-bd695.web.app",
      "https://assignment-11-bd695.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.8kmx02i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send("you're not authorized");
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
    if (error) {
      return res
        .status(403)
        .send("something went to wrong you're not authorized");
    }
    req.user = decode;
    next();
  });
};

const cookieOption = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: process.env.NODE_ENV === "production" ? true : false,
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const publicCollection = client
      .db("studyBuddy")
      .collection("allAssignments");

    const submitCollection = client
      .db("studyBuddy")
      .collection("submitedAssignments");

    //jwt cookies

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

      res
        .cookie("token", token, cookieOption)
        .send({ success: "token successfully set" });
    });

    app.post("/clearCookies", async (req, res) => {
      // console.log(req.body);
      res
        .clearCookie("token", { ...cookieOption, maxAge: 0 })
        .send({ success: true });
    });

    //create assignments
    app.post("/create", async (req, res) => {
      const body = req.body;
      const result = await publicCollection.insertOne(body);
      res.send(result);
    });

    app.get("/allAssignments", async (req, res) => {
      const result = await publicCollection.find().toArray();
      res.send(result);
    });

    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await publicCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/update-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: body.title,
          url: body.url,
          marks: body.marks,
          date: body.date,
          difficulty: body.difficulty,
          description: body.description,
        },
      };

      const result = await publicCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //submited assignments
    app.post("/submit-assignment", async (req, res) => {
      const body = req.body;
      // console.log(body);
      const result = await submitCollection.insertOne(body);
      res.send(result);
    });

    app.get("/view-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await publicCollection.findOne(query);
      res.send(result);
    });

    app.get("/my-submitted-assignments/:email", async (req, res) => {
      const email = req.params.email;
      const query = { emailAddress: email };
      const result = await submitCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/pending-assignments/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "buyerDetails.email": email };
      const result = await submitCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/pending-assignments/assignment-based/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submitCollection.findOne(query);
      res.send(result);
    });

    app.patch("/submit-marks/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;

      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          obtainedMarks: body.marks,
          feedBack: body.feedback,
          status: body.status,
        },
      };
      const result = await submitCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("study buddy server running successfully");
});

app.listen(port, () => {
  console.log(`study buddy server is running on ${port}`);
});
