const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://shashank:vasista@cluster0.xt8dcep.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Mongodb connected');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const userInputSchema = new mongoose.Schema({
    keywords: {
        type: String,
        required:true
    }
});

const collections = mongoose.model('userInputs', userInputSchema);

module.exports = { connectDB, collections };
