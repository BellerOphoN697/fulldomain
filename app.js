const express = require('express');
const session = require('express-session');
const app = express();
const mongoose = require("mongoose");
mongoose.connect('mongodb://127.0.0.1:27017/user');
const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});
const userSchema = new mongoose.Schema({
  First_name: String,
  Last_Name: String,
  Email: String,
  Password: String
});
const UserModel = new mongoose.model("user",userSchema)

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// User Login
app.get('/login', async (req, res) => {  
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.render('login', { message: '' });
});
app.post('/login', async (req, res) => {
    
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  
  const { username, password } = req.body;
  const user = await UserModel.findOne({ Email: username });
  
  if (user && user.Password === password) {
    req.session.user = username;
    
    res.redirect('/home');

  } else {
    res.render('login', { message: 'Incorrect username or password' });
  }
});

app.get('/home', requireLogin, (req, res) => {  
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  res.render('home');
});
/*
app.get('/home', (req, res) => {
  // Check if the user is authenticated by verifying session data
  if (req.session && req.session.user) {
    // User is authenticated, proceed to the dashboard
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.render('home');
  } else {
    // User is not authenticated, redirect to the login page
    res.redirect('/login');
  }
});
*/

app.get('/logout', (req, res) => {
  
  req.session.destroy(err => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});
// User Sign Up 
app.get('/signup', (req, res) => {
  res.render('signup', { message: '' });
});
app.post('/submit', async (req, res) => {
  const mail = await UserModel.findOne({ Email: req.body.email });
  if(mail){
    res.render('signup', { message: 'MailId already exist' });
  }
  else if(req.body.pw===req.body.pw_confirm){
    const user = await UserModel.create({
      First_name: req.body.first_name,
      Last_Name: req.body.last_name,
      Email: req.body.email,
      Password: req.body.pw_confirm,
     }) 
      res.render('signup', { message: 'Succefully created the account please login' });
  }
  else{
    res.render('signup', { message: 'Password not matching' });
  }
 
});
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));
function requiredLogin(req, res, next) {
  if (!req.session.admin) {
    return res.redirect('/admin-login');
  }
  next();
}
// Admin Login and Controls 
let userdetails,userexist=false;
app.get('/admin-login', (req, res) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.render('admin-login', { message: '' });
});

app.post('/admin-login', (req, res) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  const Username = 'admin';
  const Password = 'admin';
  const { username, password } = req.body;
  if (username === Username && password === Password) {
    req.session.admin = username;
    res.render('admin-home', { message: '',userdetails,findmessage:'',updatemessage:'',userexist });
  } else {
    res.render('admin-login', { message: 'Incorrect username or password' });
  }
});
app.post('/createuser', async (req, res) => {
  const mail = await UserModel.findOne({ Email: req.body.email });
  if(mail){
    res.render('admin-home', { message: 'MailId already exist',userdetails,findmessage:'',updatemessage:'',userexist });
  }
  else{
     const user = await UserModel.create({
      First_name: req.body.first_name,
      Last_Name: req.body.last_name,
      Email: req.body.email,
      Password: req.body.pw_confirm,
     }) 
      res.render('admin-home', { message: 'Successfully created the account',userdetails,findmessage:'',updatemessage:'',userexist });
  }
});
app.post('/finduser', async (req, res) => {
  const mail = await UserModel.findOne({ Email: req.body.email });
  if(!mail){
    userexist=false
    res.render('admin-home', { message: '',userdetails,findmessage:'user does not exist',updatemessage:'',userexist });
  }
  else{
    userexist=true
    userdetails = {
      Fname:mail.First_name,
      LName: mail.Last_Name,
      Email: mail.Email,
      Password: mail.Password,
     }
      res.render('admin-home', { message: '',userdetails,findmessage:'',updatemessage:'',userexist });
  }
});
app.post('/edituser', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  const user = await UserModel.findOneAndUpdate(
    { Email: email },
    { First_name: first_name, Last_Name: last_name, Password: password },
    { new: true } 
  );
  res.render('admin-home', { message:'',updatemessage:'User data updated', userdetails,findmessage:'',userexist });
});
app.get('/deleteuser/:email', async (req, res) => {
  const email = req.params.email;
  await UserModel.findOneAndRemove({ Email: email });
  res.render('admin-home', { message:'',updatemessage:'User data deleted', userdetails,findmessage:'',userexist });
});
app.get('/admin-home', requiredLogin, (req, res) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  res.render('admin-home');
});
app.get('/adlogout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
    }
    res.render('admin-login', { message: '' });
  });
});
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000/login');
});