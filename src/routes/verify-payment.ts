import express, {Request,Response} from "express";
import { body } from "express-validator";
import {BadRequestError,requireAuth,validateRequest,NotAuthorizedError,NotFoundError,OrderStatus} from '@ajaisgtickets/common';
import { Order } from "../models/order";
import { verifyPayment } from "../controller/verifysignature";
const router=express.Router()

router.post('/api/payments/verify-payment',requireAuth,[
    body('orderId').not().isEmpty(),
    body('razorpay_order_id').not().isEmpty(),
      body('razorpay_payment_id').not().isEmpty(),
        body('razorpay_signature').not().isEmpty(),
],validateRequest,async (req:Request,res:Response)=>{
const {orderId}=req.body;
const order=await Order.findById(orderId)
if(!order){
    throw new NotFoundError();
}
if(order.userId !== req.currentUser!.id){
    throw new NotAuthorizedError('not authorized in payments new route')
}
if(order.status === OrderStatus.Cancelled){
    throw new BadRequestError('badrequest in payments new: order cancelled')
}
try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const isValid = verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment",
      });
    }

    // TODO: Save to DB
    return res.json({
      success: true,
      message: "Payment verified",
    });
  } catch (err) {
    return res.status(500).json({ success: false });
  }}
)
export {router as verifyPaymentSignature}