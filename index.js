const express = require("express");
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  MongoAWSError,
} = require("mongodb");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.port || 5000;
//middle ware setup
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.8kmx02i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const publicCollection = client
      .db("studyBuddy")
      .collection("allAssignments");

    const submitCollection = client
      .db("studyBuddy")
      .collection("submitedAssignments");

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

    //submited assignments
    app.post("/submit-assignment", async (req, res) => {
      const body = req.body;
      console.log(body);
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
