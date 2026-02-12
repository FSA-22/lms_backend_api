import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../Utils/jwt.js";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../config/env.js";

// user object example
export const user1 = [
    {
    _id: "64d1b5b5b5b5b5b5b5b5b5b5",
    name: "John Doe",
    email: "john.doe@example.com",
    password: bcrypt.hashSync("password", 10),
    role: "user"
},
{
    _id: "64d1b5b5b5b5b5b5b5b5b5b6",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    password: bcrypt.hashSync("password", 10),
    role: "user"
}
]


export const login = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;


    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });   
    }
    const users = user1.find((user) => user.email === email);

    // user email validation
    if (!users) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    // user password validation
    const isPasswordValid = await bcrypt.compare(password, users.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken({ email: users.email });
    const refreshToken = generateRefreshToken({ email: users.email });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_EXPIRES_IN
    })
    res.status(200).json({
        token: accessToken,
        expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });
}