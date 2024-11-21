import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { errorHandler } from '../utils/middlewares.js';

const generateToken = (organizerId) => {
  return jwt.sign({ id: organizerId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export const orgRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(errorHandler(400, 'All fields are required'));
    }

    const existingOrganizer = await prisma.organizer.findUnique({ where: { email } });
    if (existingOrganizer) {
      return next(errorHandler(400, 'Email is already in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organizer = await prisma.organizer.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(201).json({
      message: 'Organizer registered successfully',
      organizer: { id: organizer.id, name: organizer.name, email: organizer.email },
    });
  } catch (error) {
    next(errorHandler(500, 'Internal server error'));
  }
};

export const orgLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(errorHandler(400, 'Email and password are required'));
    }

    const organizer = await prisma.organizer.findUnique({ where: { email } });
    if (!organizer) {
      return next(errorHandler(400, 'Invalid email or password'));
    }

    const isPasswordValid = await bcrypt.compare(password, organizer.password);
    if (!isPasswordValid) {
      return next(errorHandler(400, 'Invalid email or password'));
    }

    const token = generateToken(organizer.id);

    res.status(200).json({
      message: 'Login successful',
      token,
      organizer: { id: organizer.id, name: organizer.name, email: organizer.email },
    });
  } catch (error) {
    next(errorHandler(500, 'Internal server error'));
  }
};
