import express, {Request,Response} from "express";
import { body } from "express-validator";
import {BadRequestError,requireAuth,validateRequest,NotAuthorizedError,NotFoundError,OrderStatus} from '@ajaisgtickets/common';
import { Order } from "../models/order";
import { razorpay } from "../razor";
const router=express.Router()

router.post('/api/payments/',requireAuth,[
    
    body('orderId').not().isEmpty()
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
await razorpay.orders.create({
    currency: 'INR',
    receipt: `resipt_${Date.now()}`,
    amount: order.price*100,
})
res.send({ success: true,
      order})
})
export {router as newChargeRouter}