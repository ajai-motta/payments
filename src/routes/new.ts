import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  BadRequestError,
  requireAuth,
  validateRequest,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
} from "@ajaisgtickets/common";
import { Order } from "../models/order";
import { razorpay } from "../razor";
import { Payment } from "../models/payments";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";
import { natsWrapper } from "../nats-class-wrapper";
const router = express.Router();

router.post(
  "/api/payments/",
  requireAuth,
  [body("orderId").not().isEmpty()],
  validateRequest,
  async (req: Request, res: Response) => {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError();
    }
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError("not authorized in payments new route");
    }
    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError("badrequest in payments new: order cancelled");
    }
    try {
      const od = await razorpay.orders.create({
        currency: "INR",
        receipt: `resipt_${Date.now()}`,
        amount: order.price * 100,
        notes: {
            key1: process.env.RAZOR_KEY_PUBLIC!
        }
      });
      const payment = Payment.build({
        orderId: order.id,
        orderInfo: {
          id: od.id,
          entity: od.entity,
          amount: od.amount,
          amount_paid: od.amount_paid,
          amount_due: od.amount_due,
          currency: od.currency,
          status: od.status,
          created_at: od.created_at,
        },
      });
      await payment.save();
      await new PaymentCreatedPublisher(natsWrapper.client).publish({ orderId: payment.orderId, id: payment.orderInfo.id, paymentId: payment.id })
      console.log(`orderId: ${payment.orderId}, id: ${payment.orderInfo.id}, paymentId: ${payment.id}` )
      res.send({ success: true, order: od });
    } catch (err) {
      console.log(err);
    }
  },
);
export { router as newChargeRouter };
