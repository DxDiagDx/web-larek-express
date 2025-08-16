import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import { AuthRequest } from '../middlewares/auth';
import HttpCodes from '../errors/codes';
import NotFoundError from '../errors/not-found-error';
import BadRequestError from '../errors/bad-request-error';
import UnauthorizedError from '../errors/unauthorized-error';
import ConflictError from '../errors/conflict-error';

const { JWT_SECRET } = process.env;

const generateAccessToken = (userId: string) => (
  jwt.sign({ _id: userId }, JWT_SECRET!, {
    expiresIn: '10m',
  })
);

const generateRefreshToken = (userId: string) => (
  jwt.sign({ _id: userId }, JWT_SECRET!, {
    expiresIn: '7d',
  })
);

export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id)
      .orFail(new NotFoundError('Пользователь не найден'));

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

    if (!email || !password) {
      next(new BadRequestError('Неверная почта или пароль'));
      return;
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

    res.status(HttpCodes.OK).json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Неправильные почта или пароль') {
      next(new UnauthorizedError('Неправильные почта или пароль'));
      return;
    }
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password } = req.body;

    const emailUser = await User.findOne({ email });
    if (emailUser) {
      next(new ConflictError('Такой email уже зарегистрирован'));
      return;
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashPassword });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await User.findByIdAndUpdate(
      user._id,
      { $push: { tokens: { token: refreshToken } } },
      { new: true },
    ).orFail(new Error('Не удалось обновить токен пользователя'));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(HttpCodes.CREATED).json({
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
      next(new BadRequestError('Токен не найден'));
      return;
    }

    const payload = jwt.verify(refreshToken, JWT_SECRET!) as { _id: string };
    const user = await User.findById(payload._id)
      .orFail(new NotFoundError('Пользователь не найден'));

    await User.findByIdAndUpdate(user._id, {
      $pull: { tokens: { token: refreshToken } },
    }).orFail(new Error('Не удалось обновить токен пользователя'));

    res.clearCookie('refreshToken', { path: '/' });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      next(new UnauthorizedError('Токен не найден'));
      return;
    }
    const payload = jwt.verify(refreshToken, JWT_SECRET!) as { _id: string };
    const user = await User.findOne({
      _id: payload._id,
      'tokens.token': refreshToken,
    }).orFail(new UnauthorizedError('Токен недействителен'));

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    await User.findByIdAndUpdate(payload._id, {
      $pull: { tokens: { token: refreshToken } },
      $push: { tokens: { token: newRefreshToken } },
    }, { new: true }).orFail(new Error('Не удалось обновить токены'));

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
