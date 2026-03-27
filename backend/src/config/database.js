import mongoose from "mongoose";
import config from "./config.js";


const connctdb = async () => {
    
    try{
        await mongoose.connect(config.MONGO_URI);
        console.log("server is connected to database");
    }catch(err){
        console.log("error: ", err);
    }
};

export default connctdb;

