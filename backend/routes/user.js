const express = require("express");
const zod =  require("zod");
const { User } = require("../db");
const router = express.Router();
const JWT_SECRET = require("../config")
const jwt = require("jsonwebtoken");

const signupSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string()
})

router.post("/signup",async (req, res) => {
    const body = req.body;
    const {success} = signupSchema.safeParse(body);
    if(!success)
    {
        return res.json({
            message: "Email already taken / Incorrect credentials"
        })
    }

    const user = await User.findOne({
        username: body.username
    })

    if(user._id)
    {
        return res.json({
            message: "Email already taken / Incorrect credentials"
        })
    }

    const dbUser = await User.create(body);
    const token = jwt.sign({
        userId: dbUser._id
    }, JWT_SECRET) 
    res.json({
        message: "User created successfully",
        token: token
    })
})


const signinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

router.signin("/signin",async (req, res) => {
    const body = req.body;
    const {success} = signinSchema.safeParse(body);

    if(!success)
    {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const user = await User.findOne({
        username: body.username,
        password: body.password
    })

    if(user)
    {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET)

        res.json({
            token: token
        })
        return;
    }

    res.staus(411).json({
        message: "Error while loggin in"
    })

})

module.exports = router;