// req use for auto require

const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

const app = express();

// verify jwt

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "not autherize" });
  }

  jwt.verify(
    authHeader.split(" ")[1],
    process.env.SECRETE_CODE,
    function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "auth problem" });
      }
      console.log(decoded);
      req.decoded = decoded;
      next();
    }
  );
}

// midleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.USER_PASS}@cluster0.ftx3q.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db("Genius").collection("service");
    const orderCollection = client.db("Genius").collection("order");

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = await serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    app.post("/services", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    app.delete("/service/:id", async (req, res) => {
      console.log("service");
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.deleteOne(query);
      res.send(service);
    });

    // order part
    app.post("/order", async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);
      res.send(result);
    });

    app.get("/order", verifyJWT, async (req, res) => {
      const deEmail = req.decoded.email;

      const email = req.query.email;
      if (email === deEmail) {
        const query = { email: email };
        const cursor = await orderCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      } else {
        return res.status(403).send({ message: "auth problem" });
      }
    });

    // auth

    app.post("/login", (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.SECRETE_CODE, {
        expiresIn: "1d",
      });

      res.send({ accessToken });
    });
  } finally {
    //   await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("genuine car is on");
});

app.listen(port, () => {
  console.log("it is port is", port);
});
