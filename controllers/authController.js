import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { errorHandler } from '../utils/middlewares.js';



const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};


export const register = async (req, res,next) => {
  const { name, email, password } = req.body;


  if (!name || !email || !password) {
    return next(errorHandler(400, 'name,email and password are required'));
  }

  try {

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return next(errorHandler(
        409, "User already exists"
      ));
    }
    


    const hashedPassword = await bcrypt.hash(password, 10);

 
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

  
    const token = generateToken(newUser.id);


    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const login = async (req, res,next) => {

  const { email, password } = req.body;




  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(errorHandler(400,"Invalid email or password"))
      
   
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(errorHandler(400,"Invalid email or password"))
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error' });
    
  }
};
