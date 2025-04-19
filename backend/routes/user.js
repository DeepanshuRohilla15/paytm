const express = require("express");
const zod =  require("zod");
const { User, Account } = require("../db");
const router = express.Router();
const JWT_SECRET = require("../config")
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware");

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
    
    const userId = user._id

    await Account.create({
        userId,
        balance: 1 + Math.random()*10000
    })

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


const updateSchema = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    password: zod.string().optional()
})

router.put("/", authMiddleware, async (req, res) => {
    const {success} = updateSchema.safeParse(req.body)

    if(!success)
    {
        res.status(411).json({
            message: "Error while updating the information"
        })
    }

    await User.updateOne({_id: req.userId}, req.body)

    res.json({
        message: "Updated successfully"
    })
})


router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";


    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})




module.exports = router;