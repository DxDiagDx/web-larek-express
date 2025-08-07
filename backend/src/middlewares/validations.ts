import { celebrate, Joi, Segments } from 'celebrate';

interface IOrder {
  payment: 'card' | 'online';
  email: string;
  phone: string;
  address: string;
  total: number;
  items: string[];
}

const orderSchemaValidation = Joi.object<IOrder>({
  payment: Joi.required().equal('card', 'online'),
  email: Joi.string().required().email(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
  total: Joi.number().required(),
  items: Joi.array().items(Joi.string()).required(),
});

const orderValidator = celebrate({
  [Segments.BODY]: orderSchemaValidation,
});

export default orderValidator;
