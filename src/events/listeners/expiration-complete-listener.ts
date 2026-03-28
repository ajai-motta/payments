import { Listener,ExpirationCompleteEvent, OrderStatus, Subjects } from "@ajaisgtickets/common";
import { queGroupName } from "./queue-group-listener";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";


export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent>{
    subject: Subjects.ExpirationComplete=Subjects.ExpirationComplete;
    queueGroupName=queGroupName;
   async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
      console.log(data)
      const order=await Order.findById(data.orderId) 
      if(!order){
         throw Error('order not found in Expiration complete Listener')
      }
      if(order.status===OrderStatus.Cancelled){
        return;
      }
      order.set({status: OrderStatus.Cancelled})
      await order.save()
      msg.ack()
   }
}