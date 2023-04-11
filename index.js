const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

let mongoose=require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;



app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new Schema({
  username: {type: String, unique: true}
},{ versionKey: false });

const User = mongoose.model('User', userSchema);

app.get('/api/users', async (req, res) => {
  const userList = await User.find();
  res.send(userList);
});

app.post('/api/users', async (req,res) => {

  const username = req.body.username;

  const foundUser = await User.findOne({ username });

  if(foundUser){
    return res.json(foundUser);
  }

  try{
    const user = await User.create({
      username,
    });
    res.json(user);
  }
  catch(err){
    console.log(err);
  }
  
});

const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: Date,
  userId: {type: String, required: true}
}, { versionKey: false });

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users/:_id/exercises', async (req,res) => {
  
  const id = req.params._id;
  
  let { description, duration, date } = req.body;
  try
  {
    const foundUser = await User.findById(id);
  
    if(!foundUser){
      return res.send("User not found");
    }
  
    let newExercise = await Exercise.create({
      description, 
      duration, 
      date: date ? new Date(date) : new Date(),
      userId: id
    });
    
    res.json({
      username: foundUser.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(),
      _id: foundUser._id
      });
  }
  catch(err){
    console.log(err);
    res.send("There was an error saving the exercise")
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {

  let { from, to, limit } = req.query;
  
  const userId = req.params._id;
  const foundUser = await User.findById(userId);

  
  if(!foundUser){
    return res.json({ message: "User not found" });
  }

  let filter = {userId: userId};
  let dateFilter = {};

  if (from){
    dateFilter["$gte"] = new Date(from);
  }

  if(to){
    dateFilter["$lte"] = new Date(to);
  }

  if(from || to){
    filter.date = dateFilter;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500);
  
  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  
  res.json({
    username: foundUser.username,
    count: exercises.length,
    _id: foundUser._id,
    log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
