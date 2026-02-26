import mongoose from "mongoose";
import { OrderStatus } from "@ajaisgtickets/common";
interface OrderDoc extends mongoose.Document{
   version: number;
    userId: string;
    price: number;
    status: OrderStatus;

}
interface OrderAttrs{
    id: string;
    version: number;
    userId: string;
    price: number;
    status: OrderStatus;

}
interface OrderModel extends mongoose.Model<OrderDoc>{
    build(attrs:OrderAttrs):OrderDoc;

}
const orderSchema=new mongoose.Schema({
    userId: {
        type: String,
        required: true
    }
    ,
    price:{
 type: Number,
 required: true
    },
    status: {
     type: String,
     required: true,
     enum: Object.values(OrderStatus),
     default: OrderStatus.Created
    }
},{
    toJSON:{
        transform(doc,ret){
            (ret as any).id=ret._id
             
              
              delete (ret as any)._id
        }
    }
})
orderSchema.statics.build=(attrs:OrderAttrs)=>{
    return new Order({
        _id: attrs.id,
    version: attrs.version,
    userId: attrs.userId,
    price: attrs.price,
    status: attrs.status

    })
}
const Order=mongoose.model<OrderDoc,OrderModel>('Order',orderSchema)
export{Order}