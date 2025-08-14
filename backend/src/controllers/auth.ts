import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import { AuthRequest } from '../middlewares/auth';

const { JWT_SECRET } = process.env;

const generateAccessToken = (userId: string) => {
  return jwt.sign({ _id: userId }, JWT_SECRET!, {
    expiresIn: '10m',
  });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ _id: userId }, JWT_SECRET!, {
    expiresIn: '7d',
  });
};

export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    console.log('Login request body:', req.body);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Неверная почта или пароль',
      });
    }

    const user = await User.findUserByCredentials(email, password);

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.tokens.push({ token: refreshToken });
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // Срок жизни 7 дней
      path: '/',
    });

    res.status(200).json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Неправильные почта или пароль') {
      return res.status(401).json({
        success: false,
        message: 'Неправильные почта или пароль',
      });
    }
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password } = req.body;

    const emailUser = await User.findOne({ email });
    if (emailUser) {
      return res.status(409).json({ message: 'Такой email уже зарегистрирован' });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashPassword });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $push: { tokens: { token: refreshToken } } },
      { new: true },
    );

    if (!updatedUser) {
      throw new Error('Не удалось обновить токен пользователя');
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(201).json({
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Токен не найден' });
    }

    const payload = jwt.verify(refreshToken, JWT_SECRET!) as { _id: string };
    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    await User.findByIdAndUpdate(user._id, {
      $pull: { tokens: { token: refreshToken } },
    });
    res.clearCookie('refreshToken', {
      path: '/',
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Токен не найден' });
    }
    const payload = jwt.verify(refreshToken, JWT_SECRET!) as { _id: string };
    const user = await User.findOne({
      _id: payload._id,
      'tokens.token': refreshToken,
    });
    if (!user) {
      return res.status(401).json({ message: 'Токен недействителен' });
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());
    await User.findByIdAndUpdate(payload._id, {
      $pull: { tokens: { token: refreshToken } },
      $push: { tokens: { token: newRefreshToken } },
    });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.json({
      user: {
        email: user.email,
        name: user.name,
      },
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};
