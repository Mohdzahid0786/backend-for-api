const express = require('express');
require('./db/config');
const cors = require('cors')
const User = require('./db/User');
const Product = require('./db/Product');

const jwt = require('jsonwebtoken');
const jwtKey = "e-comm";
const app = express();
app.use(express.json());
app.use(cors());


app.post("/register", async (req, resp) => {
    let data = new User(req.body);
    let result = await data.save();
    result = result.toObject();
    delete result.password;
    jwt.sign({ result }, jwtKey, { expiresIn: '2h' }, (err, token) => {
        if (err) {
            resp.send({ result: "Something went wrong" });
        }
        resp.send({ result, auth: token });
    })
})

app.post('/login', async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            jwt.sign({ user }, jwtKey, { expiresIn: '2h' }, (err, token) => {
                if (err) {
                    resp.send({ result: "Something went wrong" });
                }
                resp.send({ user, auth: token });
            })
        } else {
            resp.send({ result: "User Not Found" });
        }
    } else {
        resp.send({ result: "User Not Found" });
    }
})

app.post("/add-product",async (req, resp) => {
    let data = new Product(req.body);
    let result = await data.save();
    resp.send(result);
})

app.get("/products" ,async (req, resp) => {
    let data = await Product.find();
    if (Product.length > 0) {
        resp.send(data)
    } else {
        resp.send({ result: "Product Not Found" })
    }
})

app.delete('/delete/:id', async (req, resp) => {
    let data = await Product.deleteOne({ _id: req.params.id })
    resp.send(data);
})

app.get('/product/:id', async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send(result)
    } else {
        resp.send(result)
    }
})

app.put('/update/:id', async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
        }
    )
    resp.send(result)
});

app.get('/search/:key', async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { price: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { company: { $regex: req.params.key } }
        ]
    })
    resp.send(result)
})

function verifyToken(req, resp, next) {
    let token = req.headers['authorization']
    if (token) {
        token = token.split(' ')[1];
        console.log("middleware call", token)
        jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "Please Provide valid token" })
            } else {
                next();
            }
        })
    } else {
        resp.status(403).send({ result: "Please add token in headers" })
    }

}

app.listen(5000)