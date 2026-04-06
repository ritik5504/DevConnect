import express from "express";
import morgan from "morgan"
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
const app=express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());


app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);




export default app;