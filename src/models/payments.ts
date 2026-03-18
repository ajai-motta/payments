import mongoose from "mongoose";
import Razorpay from "razorpay";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
interface paymentAttrs{
orderId: string;
orderInfo: RazorpayOrder;
}
interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number|string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: "created" | "attempted" | "paid";
  created_at: number;
}
const razorpayOrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    entity: { type: String, enum: ["order"], required: true },
    amount: { type: Number, required: true },
    amount_paid: { type: Number, required: true },
    amount_due: { type: Number, required: true },
    currency: { type: String, required: true },
    receipt: { type: String },
    status: {
      type: String,
      enum: ["created", "attempted", "paid"],
      required: true,
    },
    created_at: { type: Number, required: true },
  },
  { _id: false } // important prevents nested _id
);
interface paymentDoc extends mongoose.Document{
orderId: string;
orderInfo: RazorpayOrder;
version: number;
}
interface paymentModel extends mongoose.Model<paymentDoc>{
build(attrs:paymentAttrs):paymentDoc;
}
const paymentschema= new mongoose.Schema({
    orderId: {
        required: true,
        type: String
    },
    orderInfo:{
        required: true,
        type: razorpayOrderSchema
    }
},{
    toJSON:{
        transform(doc,ret){
            (ret as any).id=ret._id
             
              
              delete (ret as any)._id
        }
    }
})
paymentschema.set('versionKey','version')
paymentschema.plugin(updateIfCurrentPlugin)
paymentschema.statics.build=(attrs: paymentAttrs)=>{
    return new Payment(attrs)
}
const Payment=mongoose.model<paymentDoc,paymentModel>('Payment',paymentschema)
export {Payment}