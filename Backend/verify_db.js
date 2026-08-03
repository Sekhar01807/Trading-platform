const mongoose = require("mongoose");
const User = require("./model/UserModel");
require("dotenv").config();

const ATLASDB_URL = "mongodb+srv://pssekhar199189_db_user:r6y5Gsh6EP104psy@cluster0.b872qiu.mongodb.net/?appName=Cluster0"; // Hardcoded for script simplicity

async function verifyUsers() {
    try {
        await mongoose.connect(ATLASDB_URL);
        console.log("Connected to MongoDB");

        const users = await User.find({});
        console.log("Users found in DB:", users.length);
        users.forEach(user => {
            console.log(`- ${user.username} (${user.email})`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error("Error verifying users:", error);
    }
}

verifyUsers();
