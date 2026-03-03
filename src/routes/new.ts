import express, {Request,Response} from "express";
import { body } from "express-validator";
import {BadRequestError,requireAuth,validateRequest,NotAuthorizedError} from '@ajaisgtickets/common';
import { Order } from "../models/order";

const router=express.Router()

router.post('/api/payments/',requireAuth,[
    body('tocken').not().isEmpty(),
    body('orderId').not().isEmpty()
],validateRequest,(req:Request,res:Response)=>{
res.send({sucess:true})
})
export {router as newChargeRouter}