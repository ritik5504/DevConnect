import dotenv from "dotenv"
import { error } from "node:console";

dotenv.config();

if(!process.env.MONGO_URI){
    throw new error("MONGO_URI is not efine");
}


const config={
    MONGO_URI:process.env.MONGO_URI
}

export default config;