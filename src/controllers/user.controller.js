import { user1 } from "./auth.controller.js";

export const getUser = (req, res) => {
    res.json(user1.filter(user => user.email === req.user.email));
}